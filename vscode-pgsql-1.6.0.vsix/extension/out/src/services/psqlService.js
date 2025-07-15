"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PsqlService = void 0;
exports.generatePsqlConnectionArgs = generatePsqlConnectionArgs;
const vscode = require("vscode");
const connectionDialog_1 = require("../sharedInterfaces/connectionDialog");
const taskWrapper_1 = require("../utils/taskWrapper");
const Constants = require("../constants/constants");
const LocalizedConstants = require("../constants/locConstants");
const serviceclient_1 = require("../languageservice/serviceclient");
const telemetry_1 = require("../telemetry/telemetry");
const telemetry_2 = require("../sharedInterfaces/telemetry");
const vscodeWrapper_1 = require("../controllers/vscodeWrapper");
const Utils = require("../models/utils");
const path = require("path");
const psqlDownloadLink = "https://www.postgresql.org/download/";
class PsqlService {
    constructor(_context, _vscodeWrapper, _connectionManager) {
        this._context = _context;
        this._vscodeWrapper = _vscodeWrapper;
        this._connectionManager = _connectionManager;
        if (!_vscodeWrapper) {
            this._vscodeWrapper = new vscodeWrapper_1.default();
        }
    }
    registerCommands(onNewConnection) {
        this._context.subscriptions.push(vscode.commands.registerCommand(Constants.cmdPsqlTerminalDatabase, (node) => this.psqlTaskFromNode(node)));
        this._context.subscriptions.push(vscode.commands.registerCommand(Constants.cmdPsqlRunFile, () => this.psqlTaskRunFile(onNewConnection)));
    }
    psqlTaskFromNode(node) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (!((_a = vscode.workspace.workspaceFolders) === null || _a === void 0 ? void 0 : _a.length)) {
                vscode.window
                    .showErrorMessage(LocalizedConstants.noWorkspaceFolderOpen, LocalizedConstants.openFolder)
                    .then((_) => {
                    vscode.commands.executeCommand("vscode.openFolder");
                }, () => { });
                return;
            }
            yield this.psqlTask(node.connectionInfo, node.metadata.name);
        });
    }
    psqlTaskRunFile(onNewConnection) {
        return __awaiter(this, void 0, void 0, function* () {
            const activeTextEditor = this._vscodeWrapper.activeTextEditor;
            if (activeTextEditor === undefined) {
                Utils.showErrorMsg(LocalizedConstants.noActiveEditorMsg);
                return;
            }
            const activeTextEditorUri = activeTextEditor.document.uri.toString(true);
            // create new connection
            if (!this._connectionManager.isConnected(activeTextEditorUri)) {
                yield onNewConnection();
                (0, telemetry_1.sendActionEvent)(telemetry_2.TelemetryViews.PsqlService, telemetry_2.TelemetryActions.CreateConnection);
            }
            // get connection info
            const connectionInfo = this._connectionManager.getConnectionInfo(activeTextEditorUri);
            if (!connectionInfo) {
                Utils.showErrorMsg(LocalizedConstants.msgNotConnected);
                return;
            }
            // Save file, if unsaved, error out.
            activeTextEditor.document.save();
            if (activeTextEditor.document.isDirty) {
                // If the file is not saved, show an error message and return.
                Utils.showErrorMsg(LocalizedConstants.psqlFileMustBeSaved);
                return;
            }
            const filePath = activeTextEditor.document.fileName;
            const fileDirectory = path.dirname(filePath);
            yield this.psqlTask(connectionInfo.credentials, undefined, ["-f", filePath], fileDirectory);
        });
    }
    psqlTask(connectionInfo, databaseName, additionalArgs, cwd) {
        return __awaiter(this, void 0, void 0, function* () {
            const serverInfo = this._connectionManager.getServerInfo(connectionInfo);
            (0, telemetry_1.sendActionEvent)(telemetry_2.TelemetryViews.ObjectExplorer, telemetry_2.TelemetryActions.PsqlTerminal, {
                isDefaultPort: String(connectionInfo.port === Constants.DockerConstants.dockerDefaultDbPort),
                authType: connectionInfo.authenticationType,
                isCloud: String(serverInfo === null || serverInfo === void 0 ? void 0 : serverInfo.isCloud),
                pgVersion: serverInfo === null || serverInfo === void 0 ? void 0 : serverInfo.serverVersion,
            });
            const [psqlVersion, psqlExecPath] = yield serviceclient_1.default.instance.getPgBinVerAndPath(Constants.PgBinary.PSQL, serverInfo === null || serverInfo === void 0 ? void 0 : serverInfo.serverVersion);
            if (!psqlExecPath) {
                const learn = LocalizedConstants.Common.learnMore;
                vscode.window
                    .showErrorMessage(LocalizedConstants.noPsqlExec, learn)
                    .then((selection) => {
                    if (selection === learn) {
                        vscode.env.openExternal(vscode.Uri.parse(psqlDownloadLink));
                    }
                });
                (0, telemetry_1.sendActionEvent)(telemetry_2.TelemetryViews.ObjectExplorer, telemetry_2.TelemetryActions.PsqlTerminal, {
                    msg: "psqlExecPath not found",
                });
                return;
            }
            const taskName = `PSQL: ${connectionInfo.profileName}`;
            let args = generatePsqlConnectionArgs(connectionInfo, databaseName);
            if (additionalArgs) {
                args = args.concat(additionalArgs);
            }
            yield this._connectionManager.confirmEntraTokenValidity(connectionInfo);
            const psqlShellExecution = new vscode.ShellExecution(psqlExecPath, args, {
                env: {
                    PGPASSWORD: connectionInfo.authenticationType === connectionDialog_1.AuthenticationType.AzureMFA
                        ? connectionInfo.azureAccountToken
                        : connectionInfo.password,
                },
                cwd: cwd,
            });
            yield (0, taskWrapper_1.taskExecWrapper)(psqlShellExecution, taskName, true).catch((err) => {
                (0, telemetry_1.sendErrorEvent)(telemetry_2.TelemetryViews.ObjectExplorer, telemetry_2.TelemetryActions.PsqlTerminal, undefined, true, String(err), "psql unclean exit", {
                    serverVersion: serverInfo === null || serverInfo === void 0 ? void 0 : serverInfo.serverVersion,
                    localVersion: psqlVersion,
                });
            });
        });
    }
}
exports.PsqlService = PsqlService;
function generatePsqlConnectionArgs(connectionInfo, databaseName) {
    return [
        "-h",
        {
            value: connectionInfo.server,
            quoting: vscode.ShellQuoting.Strong,
        },
        "-d",
        {
            value: databaseName || connectionInfo.database,
            quoting: vscode.ShellQuoting.Strong,
        },
        "-U",
        {
            value: connectionInfo.authenticationType === connectionDialog_1.AuthenticationType.AzureMFA
                ? connectionInfo.entraUserName ||
                    connectionInfo.email
                : connectionInfo.user,
            quoting: vscode.ShellQuoting.Strong,
        },
        "-p",
        connectionInfo.port
            ? "" + connectionInfo.port
            : "" + Constants.DockerConstants.dockerDefaultDbPort,
    ];
}

//# sourceMappingURL=psqlService.js.map
