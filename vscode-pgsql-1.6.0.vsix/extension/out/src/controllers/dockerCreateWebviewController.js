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
exports.DockerCreateWebviewController = void 0;
const vscode = require("vscode");
const os = require("os");
const path = require("path");
const fs = require("fs");
const telemetry_1 = require("../sharedInterfaces/telemetry");
const connectionDialog_1 = require("../sharedInterfaces/connectionDialog");
const dockerCreate_1 = require("../sharedInterfaces/dockerCreate");
const Loc = require("../constants/locConstants");
const telemetry_2 = require("../telemetry/telemetry");
const webview_1 = require("../sharedInterfaces/webview");
const logger_1 = require("../models/logger");
const vscodeWrapper_1 = require("./vscodeWrapper");
const utils_1 = require("../utils/utils");
const Utils = require("../models/utils");
const helpers_1 = require("../docker/helpers");
const constants_1 = require("../constants/constants");
const formWebviewController_1 = require("../forms/formWebviewController");
const formComponentHelpers_1 = require("../connectionconfig/formComponentHelpers");
const prereqEntries_1 = require("../docker/prereqEntries");
class DockerCreateWebviewController extends formWebviewController_1.FormWebviewController {
    constructor(context, vscodeWrapper, _mainController, _objectExplorerProvider, _serverGroupId) {
        super(context, vscodeWrapper, "dockerCreate", "dockerCreate", new dockerCreate_1.DockerCreateWebviewState(), {
            title: Loc.CreateDialog.createDialog,
            viewColumn: vscode.ViewColumn.Active,
            iconPath: {
                dark: vscode.Uri.joinPath(context.extensionUri, "media", "pgsqlServerCreate_dark.svg"),
                light: vscode.Uri.joinPath(context.extensionUri, "media", "pgsqlServerCreate_light.svg"),
            },
        });
        this._mainController = _mainController;
        this._objectExplorerProvider = _objectExplorerProvider;
        this._serverGroupId = _serverGroupId;
        this._linkProfileAndContainerName = true;
        this._cancelRunningChecks = false;
        if (!DockerCreateWebviewController._logger) {
            const vscodeWrapper = new vscodeWrapper_1.default();
            const channel = vscodeWrapper.createOutputChannel(Loc.CreateDialog.createDialog);
            DockerCreateWebviewController._logger = logger_1.Logger.create(channel);
        }
        this.registerRpcHandlers();
        this.initializeDialog().catch((err) => {
            void vscode.window.showErrorMessage((0, utils_1.getErrorMessage)(err));
            // The spots in initializeDialog() that handle potential PII have their own error catches that emit error telemetry with `includeErrorMessage` set to false.
            // Everything else during initialization shouldn't have PII, so it's okay to include the error message here.
            (0, telemetry_2.sendErrorEvent)(telemetry_1.TelemetryViews.DockerCreate, telemetry_1.TelemetryActions.Initialize, err, true);
        });
    }
    initializeDialog() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.loadEmptyCreateProfile();
            this.state.formComponents = yield (0, formComponentHelpers_1.generateCreationComponents)();
            this.state.creationComponents = {
                mainOptions: [
                    "profileName",
                    "containerName",
                    "user",
                    "password",
                    "savePassword",
                    "database",
                    "groupId",
                ],
                topAdvancedOptions: ["port", "imageRegistry", "imageName", "imageVersion", "platform"],
                groupedAdvancedOptions: [], // computed below
            };
            this.state.creationComponents.groupedAdvancedOptions = (0, formComponentHelpers_1.groupAdvancedOptions)(this.state.formComponents, this.state.creationComponents);
            this.updateState();
        });
    }
    loadEmptyCreateProfile() {
        return __awaiter(this, void 0, void 0, function* () {
            const groupId = this._serverGroupId || (yield (0, formComponentHelpers_1.getDefaultServerGroupValue)());
            const emptyConnection = {
                id: Utils.generateGuid(),
                groupId: groupId,
                authenticationType: connectionDialog_1.AuthenticationType.SqlLogin,
                connectTimeout: constants_1.defaultConnectionTimeout,
                applicationName: constants_1.connectionApplicationName,
                user: constants_1.defaultUsername,
                database: constants_1.defaultDatabase,
                imageName: constants_1.DockerConstants.dockerImageBasename,
                imageVersion: constants_1.DockerConstants.dockerImageVerDefault,
                profileName: "",
                containerName: "",
                password: "",
                savePassword: false,
                port: NaN,
                imageRegistry: "",
            };
            this.state.creationProfile = emptyConnection;
        });
    }
    connectToCreatedDockerInstance(cleanedCreation) {
        return __awaiter(this, void 0, void 0, function* () {
            // TODO: Make timeout configuratble?
            if (!(yield helpers_1.DockerHelpers.waitDbContainerReady(cleanedCreation.containerName))) {
                this.state.formError = Loc.CreateDialog.ErrStrings.startedNotConn;
                this.state.connectionStatus = webview_1.ApiStatus.Error;
                this.updateState();
                return false;
            }
            try {
                yield this._mainController.connectionManager.connectionUI.validateAndSaveProfileFromDialog(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                cleanedCreation);
                yield this._mainController.connectionManager.connectionUI.saveProfile(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                cleanedCreation);
                const node = yield this._mainController.createObjectExplorerSessionFromDialog(cleanedCreation);
                this._objectExplorerProvider.refresh(undefined);
                this.state.connectionStatus = webview_1.ApiStatus.Loaded;
                yield this._mainController.safeRevealInObjectExplorer(node, {
                    focus: true,
                    select: true,
                    expand: true,
                });
            }
            catch (err) {
                this.state.formError = Loc.CreateDialog.ErrStrings.connectionFailure(cleanedCreation.profileName, err);
                this.state.connectionStatus = webview_1.ApiStatus.Error;
                this.updateState();
                (0, telemetry_2.sendErrorEvent)(telemetry_1.TelemetryViews.DockerCreate, telemetry_1.TelemetryActions.DockerConnect, err, true);
                return false;
            }
            return true;
        });
    }
    createLocalDockerInstance(cleanedCreation) {
        return __awaiter(this, void 0, void 0, function* () {
            const envFilePath = path.join(os.tmpdir(), `pgsql-docker-env-${Date.now()}.env`);
            fs.writeFileSync(envFilePath, `${constants_1.DockerConstants.dockerEnvVarDbPass}=${cleanedCreation.password}\n
            ${constants_1.DockerConstants.dockerEnvVarDbUser}=${cleanedCreation.user}\n
            ${constants_1.DockerConstants.dockerEnvVarDbName}=${cleanedCreation.database}\n`, {});
            if (!cleanedCreation.port) {
                const [portList, freePort] = yield (0, utils_1.getFreePort)(constants_1.DockerConstants.dockerHostPortMin, constants_1.DockerConstants.dockerHostPortMax, constants_1.DockerConstants.dockerHostPortTries);
                if (!freePort) {
                    this.logger.error(`No free ports found, tried: ${portList}`);
                    (0, telemetry_2.sendErrorEvent)(telemetry_1.TelemetryViews.DockerCreate, telemetry_1.TelemetryActions.DockerCreate, undefined, true, undefined, `No free ports found, tried: ${portList}`);
                    this.state.formError = Loc.CreateDialog.ErrStrings.randomPortAllocationFailure;
                    this.state.connectionStatus = webview_1.ApiStatus.Error;
                    return false;
                }
                cleanedCreation.port = freePort;
            }
            const containerOps = {
                imageRef: helpers_1.DockerHelpers.constructImageRef(cleanedCreation.imageRegistry, cleanedCreation.imageName, cleanedCreation.imageVersion),
                name: cleanedCreation.containerName,
                environmentFiles: [envFilePath],
                ports: [
                    {
                        containerPort: constants_1.DockerConstants.dockerDefaultDbPort,
                        hostPort: cleanedCreation.port,
                    },
                ],
                detached: true,
                publishAllPorts: false,
                platform: cleanedCreation.platform ? cleanedCreation.platform : undefined,
            };
            (0, telemetry_2.sendActionEvent)(telemetry_1.TelemetryViews.DockerCreate, telemetry_1.TelemetryActions.DockerCreate, {
                registry: cleanedCreation.imageRegistry,
                pgImage: cleanedCreation.imageName,
                pgVersion: cleanedCreation.imageVersion,
            });
            try {
                const exitCode = yield helpers_1.DockerHelpers.runContainer(containerOps);
                if (!exitCode) {
                    return true;
                }
                const created = yield helpers_1.DockerHelpers.checkContainerExists(containerOps.name);
                this.state.formError = created
                    ? Loc.CreateDialog.ErrStrings.failedToStart
                    : Loc.CreateDialog.ErrStrings.failedToCreate;
                (0, telemetry_2.sendErrorEvent)(telemetry_1.TelemetryViews.DockerCreate, telemetry_1.TelemetryActions.DockerCreate, undefined, true, undefined, created ? "Failed to start container" : "Failed to create container");
                this.state.connectionStatus = webview_1.ApiStatus.Error;
                this.updateState();
                return false;
            }
            catch (err) {
                this.state.formError = Loc.CreateDialog.ErrStrings.unexpectedErrorCreate;
                this.state.connectionStatus = webview_1.ApiStatus.Error;
                this.updateState();
                (0, telemetry_2.sendErrorEvent)(telemetry_1.TelemetryViews.DockerCreate, telemetry_1.TelemetryActions.DockerCreate, err, true, undefined, "Unexpected error");
                return false;
            }
            finally {
                fs.rmSync(envFilePath, {
                    force: true,
                });
            }
        });
    }
    postValidateDockerCreate(profileName, containerName) {
        return __awaiter(this, void 0, void 0, function* () {
            const existingConnections = yield this._mainController.connectionManager.connectionStore.readAllConnections(false);
            const connMatch = existingConnections.find((conn) => {
                return conn.profileName === profileName;
            });
            if (connMatch) {
                this.state.connectionStatus = webview_1.ApiStatus.Error;
                this.state.formError = Loc.CreateDialog.ErrStrings.duplicateConnection(profileName);
                this.updateState();
                return false;
            }
            if (yield helpers_1.DockerHelpers.checkContainerExists(containerName, true)) {
                this.state.connectionStatus = webview_1.ApiStatus.Error;
                this.state.formError = Loc.CreateDialog.ErrStrings.duplicateContainer(containerName);
                this.updateState();
                return false;
            }
            return true;
        });
    }
    handleCreateCallback(state) {
        return __awaiter(this, void 0, void 0, function* () {
            this.state.connectionStatus = webview_1.ApiStatus.Loading;
            this.state.formError = "";
            this.updateState();
            const cleanedCreation = structuredClone(this.state.creationProfile);
            // Validate form inputs
            const erroredInputs = yield this.validateForm(cleanedCreation);
            if (erroredInputs.length > 0) {
                this.state.connectionStatus = webview_1.ApiStatus.Error;
                return state;
            }
            // Set extra fields for Docker creation
            cleanedCreation.server = constants_1.DockerConstants.dockerHostIpStr;
            if (!(yield this.postValidateDockerCreate(cleanedCreation.profileName, cleanedCreation.containerName))) {
                return state;
            }
            const created = yield this.createLocalDockerInstance(cleanedCreation);
            if (!created) {
                return state;
            }
            const connected = yield this.connectToCreatedDockerInstance(cleanedCreation).catch((err) => {
                this.state.connectionStatus = webview_1.ApiStatus.Error;
                this.state.formError = Loc.CreateDialog.ErrStrings.unexpectedErrorConnect;
                (0, telemetry_2.sendErrorEvent)(telemetry_1.TelemetryViews.DockerCreate, telemetry_1.TelemetryActions.DockerCreate, err, true);
                this.updateState();
                return false;
            });
            if (connected) {
                yield this.panel.dispose();
            }
            return state;
        });
    }
    runPrereqChecks(state) {
        return __awaiter(this, void 0, void 0, function* () {
            this._cancelRunningChecks = false;
            // Initialize the preqreq check page
            const prereqDefs = prereqEntries_1.DockerPrereqChecks.getDockerPrereqs();
            this.state.prereqs = prereqDefs.map((def) => {
                return {
                    state: dockerCreate_1.PrereqState.WAITING,
                    title: def.title,
                    desc: def.waitDesc,
                    resLink: def.resLink,
                    resText: def.resText,
                };
            });
            this.state.page = dockerCreate_1.DisplayedPage.PREREQ;
            this.updateState();
            // Run each prereq check and update state accordingly
            for (let idx = 0; idx < prereqDefs.length; idx++) {
                if (this._cancelRunningChecks) {
                    return state;
                }
                if (!(yield prereqDefs[idx].runner())) {
                    this.state.prereqs[idx].state = dockerCreate_1.PrereqState.FAILED;
                    this.state.prereqs[idx].desc = prereqDefs[idx].failDesc;
                    this.updateState();
                    break;
                }
                this.state.prereqs[idx].state = dockerCreate_1.PrereqState.SUCCESS;
                this.state.prereqs[idx].desc = prereqDefs[idx].normDesc;
                this.updateState();
            }
            return state;
        });
    }
    registerRpcHandlers() {
        this.registerReducer("formAction", (state, payload) => __awaiter(this, void 0, void 0, function* () {
            if (payload.event.propertyName === "containerName" &&
                payload.event.value !== state.formState["containerName"]) {
                this._linkProfileAndContainerName = false;
            }
            if (payload.event.propertyName === "profileName" && this._linkProfileAndContainerName) {
                this.state.formState["containerName"] = String(payload.event.value).replace(/ /g, "_");
            }
            return this.handleFormAction(state, payload);
        }));
        this.registerReducer("continue", (state) => {
            switch (state.page) {
                case dockerCreate_1.DisplayedPage.HOME:
                    return this.runPrereqChecks(state);
                case dockerCreate_1.DisplayedPage.PREREQ:
                    if (state.prereqs.every((req) => {
                        return req.state === dockerCreate_1.PrereqState.SUCCESS;
                    })) {
                        this.state.page = dockerCreate_1.DisplayedPage.CREATE;
                        return state;
                    }
                    return this.runPrereqChecks(state);
                case dockerCreate_1.DisplayedPage.CREATE:
                    return this.handleCreateCallback(state);
                default:
                    this.logger.logDebug(`Unexpected page state ${state.page}`);
                    return state;
            }
        });
        this.registerReducer("cancel", (state) => {
            this._cancelRunningChecks = true;
            this.panel.dispose();
            return state;
        });
    }
    updateItemVisibility() {
        return;
    }
    getActiveFormComponents(state) {
        return state.creationComponents.mainOptions;
    }
}
exports.DockerCreateWebviewController = DockerCreateWebviewController;

//# sourceMappingURL=dockerCreateWebviewController.js.map
