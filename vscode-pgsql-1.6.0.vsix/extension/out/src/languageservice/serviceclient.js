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
const vscode = require("vscode");
const vscode_languageclient_1 = require("vscode-languageclient");
const path = require("path");
const fs = require("fs/promises");
const semver = require("semver");
const vscodeWrapper_1 = require("../controllers/vscodeWrapper");
const Utils = require("../models/utils");
const logger_1 = require("../models/logger");
const Constants = require("../constants/constants");
const server_1 = require("./server");
const serviceDownloadProvider_1 = require("./serviceDownloadProvider");
const decompressProvider_1 = require("./decompressProvider");
const httpClient_1 = require("./httpClient");
const extConfig_1 = require("../configurations/extConfig");
const platform_1 = require("../models/platform");
const serverStatus_1 = require("./serverStatus");
const statusView_1 = require("../views/statusView");
const LanguageServiceContracts = require("../models/contracts/languageService");
const utils_1 = require("../utils/utils");
const process_1 = require("process");
const utils_2 = require("../azure/utils");
const constants_1 = require("../azure/constants");
const taskWrapper_1 = require("../utils/taskWrapper");
const telemetry_1 = require("../telemetry/telemetry");
const telemetry_2 = require("../sharedInterfaces/telemetry");
const PGSQL_OVERRIDE_ENV_VAR = "PGTOOLSSERVICE_OVERRIDE";
const PGSQL_LOG_FILE_OVERRIDE_ENV_VAR = "PGTS_LOG_FILE";
const PGSQL_TOOLS_SERVICE_LOG_FILE = "pgsql-tools.log";
let _channel = undefined;
/**
 * Handle Language Service client errors
 * @class LanguageClientErrorHandler
 */
class LanguageClientErrorHandler {
    /**
     * Creates an instance of LanguageClientErrorHandler.
     * @memberOf LanguageClientErrorHandler
     */
    constructor(vscodeWrapper) {
        this.vscodeWrapper = vscodeWrapper;
        if (!this.vscodeWrapper) {
            this.vscodeWrapper = new vscodeWrapper_1.default();
        }
    }
    /**
     * Show an error message prompt with a link to known issues wiki page
     * @memberOf LanguageClientErrorHandler
     */
    showOnErrorPrompt(error, message) {
        (0, telemetry_1.sendErrorEvent)(telemetry_2.TelemetryViews.ToolsService, telemetry_2.TelemetryActions.Initialize, error, true, undefined, undefined, { rpcMessage: message === null || message === void 0 ? void 0 : message.jsonrpc });
        this.vscodeWrapper
            .showErrorMessage(Constants.sqlToolsServiceCrashMessage, Constants.sqlToolsServiceCrashButton)
            .then((action) => {
            if (action && action === Constants.sqlToolsServiceCrashButton) {
                vscode.env.openExternal(vscode.Uri.parse(Constants.sqlToolsServiceCrashLink));
            }
        });
    }
    /**
     * Callback for language service client error
     *
     * @param error
     * @param message
     * @param count
     * @returns
     *
     * @memberOf LanguageClientErrorHandler
     */
    error(error, message, count) {
        this.showOnErrorPrompt(error, message);
        // we don't retry running the service since crashes leave the extension
        // in a bad, unrecovered state
        return vscode_languageclient_1.ErrorAction.Shutdown;
    }
    /**
     * Callback for language service client closed
     *
     * @returns
     *
     * @memberOf LanguageClientErrorHandler
     */
    closed() {
        const err = new Error("Language client closed unexpectedly");
        this.showOnErrorPrompt(err);
        // we don't retry running the service since crashes leave the extension
        // in a bad, unrecovered state
        return vscode_languageclient_1.CloseAction.DoNotRestart;
    }
}
// The Service Client class handles communication with the VS Code LanguageClient
class SqlToolsServiceClient {
    /**
     * Path to the root of the SQL Tools Service folder
     */
    get sqlToolsServicePath() {
        return this._sqlToolsServicePath;
    }
    /**
     * Path to the pgsql-tools log file
     */
    get pgsqlToolsLogPath() {
        if (process_1.env[PGSQL_LOG_FILE_OVERRIDE_ENV_VAR]) {
            return process_1.env[PGSQL_LOG_FILE_OVERRIDE_ENV_VAR];
        }
        if (this._logDirectoryUri === undefined) {
            this._logger.appendLine("Log directory URI is not set, unable to get pgsql-tools log path");
            return "";
        }
        if (this._logDirectoryUri.fsPath === undefined) {
            this._logger.appendLine("Log directory URI fsPath is not set, unable to get pgsql-tools log path");
            return "";
        }
        return path.join(this._logDirectoryUri.fsPath, PGSQL_TOOLS_SERVICE_LOG_FILE);
    }
    get platformInfo() {
        return this._platformInfo;
    }
    // getter method for the Language Client
    get client() {
        return this._client;
    }
    set client(client) {
        this._client = client;
    }
    // getter method for language client diagnostic collection
    get diagnosticCollection() {
        return this._client.diagnostics;
    }
    get logger() {
        return this._logger;
    }
    constructor(_config, _server, _logger, _statusView, _vscodeWrapper) {
        this._config = _config;
        this._server = _server;
        this._logger = _logger;
        this._statusView = _statusView;
        this._vscodeWrapper = _vscodeWrapper;
        this._sqlToolsServicePath = undefined;
        // Enumerated PG binaries
        this._resolvedPgBinaries = new Map();
        // VS Code Language Client
        this._client = undefined;
        this._resourceClient = undefined;
    }
    // gets or creates the singleton SQL Tools service client instance
    static get instance() {
        if (SqlToolsServiceClient._instance === undefined) {
            let config = new extConfig_1.default();
            let vscodeWrapper = new vscodeWrapper_1.default();
            _channel = vscodeWrapper.outputChannel;
            let logger = logger_1.Logger.create(_channel, Constants.serviceInitializingOutputChannelName);
            let serverStatusView = new serverStatus_1.ServerStatusView();
            let httpClient = new httpClient_1.default();
            let decompressProvider = new decompressProvider_1.default();
            let downloadProvider = new serviceDownloadProvider_1.default(config, logger, serverStatusView, httpClient, decompressProvider);
            let serviceProvider = new server_1.default(downloadProvider, config, serverStatusView);
            let statusView = new statusView_1.default(vscodeWrapper);
            SqlToolsServiceClient._instance = new SqlToolsServiceClient(config, serviceProvider, logger, statusView, vscodeWrapper);
        }
        return SqlToolsServiceClient._instance;
    }
    // initialize the SQL Tools Service Client instance by launching
    // out-of-proc server through the LanguageClient
    initialize(context) {
        return __awaiter(this, void 0, void 0, function* () {
            this._logger.appendLine(Constants.serviceInitializing);
            this._logDirectoryUri = context.logUri;
            if (this.client) {
                this._logger.appendLine("Stopping existing language client");
                yield this.client.stop();
            }
            return platform_1.PlatformInformation.getCurrent().then((pInfo) => {
                this._platformInfo = pInfo;
                return this.initializeForPlatform(this._platformInfo, context);
            });
        });
    }
    initializeForPlatform(platformInfo, context) {
        return new Promise((resolve, reject) => {
            this._logger.appendLine(Constants.commandsNotAvailableWhileInstallingTheService);
            this._logger.appendLine();
            this._logger.append(`Platform: ${platformInfo.toString()}`);
            if (!platformInfo.isValidRuntime) {
                this._logger.appendLine(`Invalid platform runtime: ${platformInfo.runtimeId}`);
                Utils.showErrorMsg(Constants.unsupportedPlatformErrorMessage);
                reject("Invalid Platform");
            }
            else {
                if (platformInfo.runtimeId) {
                    this._logger.appendLine(` (${platformInfo.getRuntimeDisplayName()})`);
                }
                else {
                    this._logger.appendLine(`Platform runtimeId is not set`);
                }
                this._logger.appendLine();
                // For macOS we need to ensure the tools service version is set appropriately
                this.updateServiceVersion(platformInfo);
                this._logger.appendLine(`Checking server path for runtime ID: ${platformInfo.runtimeId}`);
                this._server
                    .getServerPath(platformInfo.runtimeId)
                    .then((serverPath) => __awaiter(this, void 0, void 0, function* () {
                    if (serverPath === undefined) {
                        this._logger.appendLine(`Server path not found for runtime ID: ${platformInfo.runtimeId}`);
                        // Check if the service already installed and if not open the output channel to show the logs
                        if (_channel !== undefined) {
                            _channel.show();
                        }
                        this._logger.appendLine("Downloading server files");
                        let installedServerPath = yield this._server.downloadServerFiles(platformInfo.runtimeId);
                        this._logger.appendLine(`Server files downloaded to: ${installedServerPath}`);
                        this._sqlToolsServicePath = path.dirname(installedServerPath);
                        this._logger.appendLine("Attempting to initialize language client");
                        yield this.initializeLanguageClient(installedServerPath, context, platformInfo.isWindows);
                        this._logger.appendLine("Waiting for client to be ready");
                        yield this._client.onReady();
                        this._logger.appendLine("Client is ready");
                        resolve(new serverStatus_1.ServerInitializationResult(true, true, installedServerPath));
                    }
                    else {
                        this._logger.appendLine(`Tools Service path: ${serverPath}`);
                        this._sqlToolsServicePath = path.dirname(serverPath);
                        // Make an obvious log entry for the service log
                        // path so it can be found easily when asking for
                        // additional debug information from the user
                        this._logger.log(`
**************************************************
PG Tools Service log path can be found at:
${this.pgsqlToolsLogPath}
**************************************************
`);
                        this._logger.appendLine(`Initializing language client`);
                        yield this.initializeLanguageClient(serverPath, context, platformInfo.isWindows);
                        this._logger.appendLine("Waiting for client to be ready");
                        yield this._client.onReady();
                        this._logger.appendLine("Client is ready");
                        resolve(new serverStatus_1.ServerInitializationResult(false, true, serverPath));
                    }
                }))
                    .catch((err) => {
                    this._logger.appendLine(Constants.serviceLoadingFailed + " " + err);
                    Utils.logDebug(Constants.serviceLoadingFailed + " " + err);
                    Utils.showErrorMsg(Constants.serviceLoadingFailed);
                    reject(err);
                });
            }
        });
    }
    updateServiceVersion(platformInfo) {
        if (platformInfo.isMacOS && platformInfo.isMacVersionLessThan("10.12.0")) {
            // Version 1.0 is required as this is the last one supporting downlevel macOS versions
            this._logger.appendLine(`Downlevel macOS version detected, using service version 1.0`);
            this._config.useServiceVersion(1);
        }
    }
    /**
     * Gets the known service version of the backing tools service. This can be useful for filtering
     * commands that are not supported if the tools service is below a certain known version
     *
     * @returns
     * @memberof SqlToolsServiceClient
     */
    getServiceVersion() {
        return this._config.getServiceVersion();
    }
    /**
     * Initializes the SQL language configuration
     *
     * @memberOf SqlToolsServiceClient
     */
    initializeLanguageConfiguration() {
        vscode.languages.setLanguageConfiguration("sql", {
            comments: {
                lineComment: "--",
                blockComment: ["/*", "*/"],
            },
            brackets: [
                ["{", "}"],
                ["[", "]"],
                ["(", ")"],
            ],
            __characterPairSupport: {
                autoClosingPairs: [
                    { open: "{", close: "}" },
                    { open: "[", close: "]" },
                    { open: "(", close: ")" },
                    { open: '"', close: '"', notIn: ["string"] },
                    { open: "'", close: "'", notIn: ["string", "comment"] },
                ],
            },
        });
    }
    initializeLanguageClient(serverPath, context, isWindows) {
        return __awaiter(this, void 0, void 0, function* () {
            if (serverPath === undefined) {
                this._logger.appendLine(`Unable to initialize Language Client: ${Constants.invalidServiceFilePath}`);
                Utils.logDebug(Constants.invalidServiceFilePath);
                throw new Error(Constants.invalidServiceFilePath);
            }
            else {
                this._logger.appendLine(`Checking overrides for language client initialization`);
                let overridePath = undefined;
                this.initializeLanguageConfiguration();
                // This env var is used to override the base install location of STS - primarily to be used for debugging scenarios.
                try {
                    const exeFiles = this._config.getSqlToolsExecutableFiles();
                    const stsRootPath = process_1.env[PGSQL_OVERRIDE_ENV_VAR];
                    if (stsRootPath) {
                        for (const exeFile of exeFiles) {
                            const serverFullPath = path.join(stsRootPath, exeFile);
                            if (yield (0, utils_1.exists)(serverFullPath)) {
                                const overrideMessage = `Using ${exeFile} from ${stsRootPath}`;
                                void vscode.window.showInformationMessage(overrideMessage);
                                this._logger.appendLine(overrideMessage);
                                overridePath = serverFullPath;
                                break;
                            }
                        }
                        if (!overridePath) {
                            this._logger.appendLine(`Could not find valid PG Tools Service EXE from ${JSON.stringify(exeFiles)} at ${stsRootPath}, falling back to config`);
                        }
                    }
                }
                catch (err) {
                    this._logger.appendLine("Unexpected error getting override path for PG Tools Service client " + err);
                    // Fall back to config if something unexpected happens here
                }
                // Use the override path if we have one, otherwise just use the original serverPath passed in
                if (overridePath) {
                    this._sqlToolsServicePath = path.resolve(overridePath, "..");
                }
                let serverOptions = this.createServiceLayerServerOptions(overridePath || serverPath);
                this._logger.appendLine(`Creating the language client with options: ${JSON.stringify(serverOptions)}`);
                this.client = this.createLanguageClient(serverOptions);
                this._logger.appendLine(`Language client created`);
                let executablePath = isWindows
                    ? Constants.windowsResourceClientPath
                    : Constants.unixResourceClientPath;
                // @ts-ignore TODO-PG: resource client is not used
                let resourcePath = path.join(path.dirname(serverPath), executablePath);
                // See if the override path exists and has the resource client as well, and if so use that instead
                if (overridePath) {
                    const overrideDir = path.dirname(overridePath);
                    const resourceOverridePath = path.join(overrideDir, executablePath);
                    const resourceClientOverrideExists = yield (0, utils_1.exists)(resourceOverridePath);
                    if (resourceClientOverrideExists) {
                        const overrideMessage = `Using ${resourceOverridePath} from ${overrideDir}`;
                        void vscode.window.showInformationMessage(overrideMessage);
                        console.log(overrideMessage);
                        resourcePath = resourceOverridePath;
                    }
                }
                if (context !== undefined) {
                    // Create the language client and start the client.
                    this._logger.appendLine("Starting language client");
                    let disposable = this.client.start();
                    this._logger.appendLine("Language client started");
                    context.subscriptions.push(disposable);
                }
                else {
                    this._logger.appendLine("Failed to initialize language client, context is not set");
                }
            }
        });
    }
    createLanguageClient(serverOptions) {
        // Options to control the language client
        let clientOptions = {
            documentSelector: ["sql"],
            diagnosticCollectionName: "mssql",
            synchronize: {
                configurationSection: [Constants.extensionConfigSectionName],
            },
            errorHandler: new LanguageClientErrorHandler(this._vscodeWrapper),
        };
        // cache the client instance for later use
        let client = new vscode_languageclient_1.LanguageClient(Constants.sqlToolsServiceName, serverOptions, clientOptions);
        void client.onReady().then(() => {
            client.onNotification(LanguageServiceContracts.StatusChangedNotification.type, this.handleLanguageServiceStatusNotification());
        });
        return client;
    }
    generateResourceServiceServerOptions(executablePath) {
        let launchArgs = Utils.getCommonLaunchArgsAndCleanupOldLogFiles(executablePath, this._logDirectoryUri.fsPath, "resourceprovider.log");
        return {
            command: executablePath,
            args: launchArgs,
            transport: vscode_languageclient_1.TransportKind.stdio,
        };
    }
    // @ts-ignore TODO-PG: resource client is not used
    createResourceClient(resourcePath) {
        // add resource provider path here
        let serverOptions = this.generateResourceServiceServerOptions(resourcePath);
        // client options are undefined since we don't want to send language events to the
        // server, since it's handled by the main client
        let client = new vscode_languageclient_1.LanguageClient(Constants.resourceServiceName, serverOptions, undefined);
        return client;
    }
    /**
     * Public for testing purposes only.
     */
    handleLanguageServiceStatusNotification() {
        return (event) => {
            this._statusView.languageServiceStatusChanged(event.ownerUri, event.status);
        };
    }
    createServiceLayerServerOptions(servicePath) {
        let serverArgs = [];
        let serverCommand = servicePath;
        if (servicePath.endsWith(".py")) {
            serverArgs = [servicePath, "--enable-remote-debugging"];
            serverCommand = process_1.env["PYTHON_SERVICE_EXECUTABLE"] || "python";
        }
        // Get the extenion's configuration
        let config = vscode.workspace.getConfiguration(Constants.extensionConfigSectionName);
        if (config) {
            // Populate common args
            serverArgs = serverArgs.concat(Utils.getCommonLaunchArgsAndCleanupOldLogFiles(servicePath, this._logDirectoryUri.fsPath, PGSQL_TOOLS_SERVICE_LOG_FILE));
            // Pass parent process ID so the language server can monitor and exit if the parent (VS Code) dies
            serverArgs.push("--parent-pid", process.pid.toString());
            // Send application name and path to determine MSAL cache location
            serverArgs.push("--application-name", constants_1.serviceName);
            serverArgs.push("--data-path", (0, utils_2.getAppDataPath)());
            // Enable SQL Auth Provider registration for Azure MFA Authentication
            const enableSqlAuthenticationProvider = (0, utils_2.getEnableSqlAuthenticationProviderConfig)();
            if (enableSqlAuthenticationProvider) {
                serverArgs.push("--enable-sql-authentication-provider");
            }
            // Send Locale for sqltoolsservice localization
            let applyLocalization = config[Constants.configApplyLocalization];
            if (applyLocalization) {
                let locale = vscode.env.language;
                serverArgs.push("--locale");
                serverArgs.push(locale);
            }
            // Enable message recording if env var is set
            var recordMessagesToFile = process_1.env["PGTS_RECORD_MESSAGES_TO_FILE"];
            if (recordMessagesToFile) {
                serverArgs.push("--record-messages-to-file");
                serverArgs.push(recordMessagesToFile);
                serverArgs.push("--recorder-autosave-seconds");
                serverArgs.push("60");
            }
        }
        // run the service host using dotnet.exe from the path
        let serverOptions = {
            command: serverCommand,
            args: serverArgs,
            transport: vscode_languageclient_1.TransportKind.stdio,
        };
        return serverOptions;
    }
    shutdown() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.client !== undefined) {
                this._logger.appendLine("Shutting down language client");
                yield this.client.stop();
                this.client = undefined;
            }
            else {
                this._logger.appendLine("Language client is not initialized");
            }
        });
    }
    /**
     * Send a request to the service client
     * @param type The of the request to make
     * @param params The params to pass with the request
     * @returns A thenable object for when the request receives a response
     */
    // tslint:disable-next-line:no-unused-variable
    sendRequest(type, params) {
        if (this.client !== undefined) {
            return this.client.sendRequest(type, params);
        }
    }
    /**
     * Send a request to the service client
     * @param type The of the request to make
     * @param params The params to pass with the request
     * @returns A thenable object for when the request receives a response
     */
    // tslint:disable-next-line:no-unused-variable
    sendResourceRequest(type, params) {
        if (this._resourceClient !== undefined) {
            return this._resourceClient.sendRequest(type, params);
        }
    }
    /**
     * Send a notification to the service client
     * @param params The params to pass with the notification
     */
    // tslint:disable-next-line:no-unused-variable
    sendNotification(type, params) {
        if (this.client !== undefined) {
            this.client.sendNotification(type, params);
        }
    }
    /**
     * Register a handler for a notification type
     * @param type The notification type to register the handler for
     * @param handler The handler to register
     */
    // tslint:disable-next-line:no-unused-variable
    onNotification(type, handler) {
        if (this._client !== undefined) {
            return this.client.onNotification(type, handler);
        }
    }
    /**
     * Register a handler for a request type
     * @param type The request type to register the handler for
     * @param handler The handler to register
     */
    // tslint:disable-next-line:no-unused-variable
    onRequest(type, handler) {
        if (this._client !== undefined) {
            return this.client.onRequest(type, handler);
        }
    }
    /**
     * Get the directory path for bundled psql binary, if it exists
     */
    getPgBinVerAndPath(binType, pgVersion) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.info(`Target is pg version ${pgVersion}`);
            if (!this._resolvedPgBinaries.has(binType)) {
                this._resolvedPgBinaries.set(binType, yield this.enumeratePgBins(binType));
            }
            this.logger.info("Found binary versions: ", this._resolvedPgBinaries.get(binType));
            const sortedVers = Array.from(this._resolvedPgBinaries.get(binType).keys()).sort(semver.compare);
            if (pgVersion) {
                for (const ver of sortedVers) {
                    if (semver.satisfies(pgVersion, "<=" + ver)) {
                        return [ver, this._resolvedPgBinaries.get(binType).get(ver)];
                    }
                }
            }
            // No suitable version found, return latest and hope for the best
            const highestVer = sortedVers[sortedVers.length - 1];
            return [highestVer, this._resolvedPgBinaries.get(binType).get(highestVer)];
        });
    }
    enumeratePgBins(binType) {
        return __awaiter(this, void 0, void 0, function* () {
            let verMap = new Map();
            const userDirs = vscode.workspace
                .getConfiguration()
                .get(Constants.configBYOPgBinaryDirectories);
            const toolDirs = (yield fs
                .readdir(path.join(this._sqlToolsServicePath, "pg_exes", Constants.PlatformExecDir[this.platformInfo.platform]), {
                withFileTypes: true,
            })
                .catch(() => {
                return [];
            }))
                .filter((value) => value.isDirectory())
                .map((value) => {
                return path.join(value.parentPath, value.name);
            });
            const pathDirs = process_1.env["PATH"].split(this.platformInfo.platform === Constants.Platform.Windows ? ";" : ":");
            const binName = binType + (this.platformInfo.platform === Constants.Platform.Windows ? ".exe" : "");
            for (const dirPath of toolDirs.concat(pathDirs).concat(userDirs)) {
                const binPath = path.join(dirPath, binName);
                yield (0, taskWrapper_1.shellExecWrapper)(binPath, ["--version"], true).then(([_1, stdout, _2]) => {
                    const verMatch = stdout.match(Constants.pgVersionOutputRegex);
                    verMap.set((verMatch[1] ? verMatch[1] : "0") +
                        (verMatch[2] ? verMatch[2] : ".0") +
                        (verMatch[3] ? verMatch[3] : ".0"), binPath);
                }, () => { });
            }
            return verMap;
        });
    }
}
// singleton instance
SqlToolsServiceClient._instance = undefined;
exports.default = SqlToolsServiceClient;

//# sourceMappingURL=serviceclient.js.map
