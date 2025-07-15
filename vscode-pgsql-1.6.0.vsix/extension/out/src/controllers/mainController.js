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
const events = require("events");
const fs = require("fs");
const path = require("path");
const vscode = require("vscode");
const azureResourceController_1 = require("../azure/azureResourceController");
const Constants = require("../constants/constants");
const LocalizedConstants = require("../constants/locConstants");
const serviceclient_1 = require("../languageservice/serviceclient");
const ConnInfo = require("../models/connectionInfo");
const languageService_1 = require("../models/contracts/languageService");
const scriptingRequest_1 = require("../models/contracts/scripting/scriptingRequest");
const sqlOutputContentProvider_1 = require("../models/sqlOutputContentProvider");
const Utils = require("../models/utils");
const objectExplorerProvider_1 = require("../objectExplorer/objectExplorerProvider");
const objectExplorerUtils_1 = require("../objectExplorer/objectExplorerUtils");
const treeNodeInfo_1 = require("../objectExplorer/treeNodeInfo");
const adapter_1 = require("../prompts/adapter");
const protocol_1 = require("../protocol");
const queryHistoryProvider_1 = require("../queryHistory/queryHistoryProvider");
const scriptingService_1 = require("../scripting/scriptingService");
const azureAccountService_1 = require("../services/azureAccountService");
const azureResourceService_1 = require("../services/azureResourceService");
const dacFxService_1 = require("../services/dacFxService");
const sqlProjectsService_1 = require("../services/sqlProjectsService");
const schemaCompareService_1 = require("../services/schemaCompareService");
const sqlTasksService_1 = require("../services/sqlTasksService");
const statusView_1 = require("../views/statusView");
const interfaces_1 = require("./../models/interfaces");
const connectionManager_1 = require("./connectionManager");
const serverGroupManager_1 = require("../connectionconfig/serverGroupManager");
const untitledSqlDocumentService_1 = require("./untitledSqlDocumentService");
const vscodeWrapper_1 = require("./vscodeWrapper");
const telemetry_1 = require("../telemetry/telemetry");
const telemetry_2 = require("../sharedInterfaces/telemetry");
const tableDesignerService_1 = require("../services/tableDesignerService");
const tableDesignerWebviewController_1 = require("../tableDesigner/tableDesignerWebviewController");
const connectionDialogWebviewController_1 = require("../connectionconfig/connectionDialogWebviewController");
const objectExplorerFilter_1 = require("../objectExplorer/objectExplorerFilter");
const executionPlanService_1 = require("../services/executionPlanService");
const executionPlanWebviewController_1 = require("./executionPlanWebviewController");
const queryResultWebViewController_1 = require("../queryResult/queryResultWebViewController");
const pgsqlProtocolHandler_1 = require("../pgsqlProtocolHandler");
const utils_1 = require("../utils/utils");
const userSurvey_1 = require("../nps/userSurvey");
const objectExplorerDragAndDropController_1 = require("../objectExplorer/objectExplorerDragAndDropController");
const chatService_1 = require("../services/copilot/chat/chatService");
const toolService_1 = require("../services/copilot/tools/toolService");
const schemaDesignerService_1 = require("../services/schemaDesignerService");
const singletonStore_1 = require("../queryResult/singletonStore");
const schemaCompareWebViewController_1 = require("../schemaCompare/schemaCompareWebViewController");
const locConstants_1 = require("../constants/locConstants");
const connectionCredentials_1 = require("../models/connectionCredentials");
const psqlService_1 = require("../services/psqlService");
const serverCreateService_1 = require("../services/serverCreate/serverCreateService");
const logger_1 = require("../models/logger");
const connectionLensManager_1 = require("../connectionconfig/connectionLensManager");
/**
 * The main controller class that initializes the extension
 */
class MainController {
    /**
     * The main controller constructor
     * @constructor
     */
    constructor(context, connectionManager, vscodeWrapper) {
        this._event = new events.EventEmitter();
        this._initialized = false;
        this._disconnectWithDelayUris = [];
        this._recentlyVisibleUris = [];
        this._queryHistoryRegistered = false;
        this._executionPlanOptions = {
            includeEstimatedExecutionPlanXml: false,
            includeActualExecutionPlanXml: false,
        };
        this.ExecutionPlanCustomEditorProvider = class {
            constructor(context, vscodeWrapper, executionPlanService, untitledSqlService) {
                this.context = context;
                this.vscodeWrapper = vscodeWrapper;
                this.executionPlanService = executionPlanService;
                this.untitledSqlService = untitledSqlService;
                this.context = context;
                this.executionPlanService = executionPlanService;
                this.untitledSqlService = untitledSqlService;
            }
            resolveCustomTextEditor(document) {
                return __awaiter(this, void 0, void 0, function* () {
                    yield this.onOpenExecutionPlanFile(document);
                });
            }
            onOpenExecutionPlanFile(document) {
                return __awaiter(this, void 0, void 0, function* () {
                    const planContents = document.getText();
                    let docName = document.fileName;
                    docName = docName.substring(docName.lastIndexOf(path.sep) + 1);
                    vscode.commands.executeCommand("workbench.action.closeActiveEditor");
                    const executionPlanController = new executionPlanWebviewController_1.ExecutionPlanWebviewController(this.context, this.vscodeWrapper, this.executionPlanService, this.untitledSqlService, planContents, vscode.l10n.t({
                        message: "{0}",
                        args: [docName],
                        comment: "{0} is the file name",
                    }));
                    executionPlanController.revealToForeground();
                });
            }
        };
        this._context = context;
        if (connectionManager) {
            this._connectionMgr = connectionManager;
        }
        this._vscodeWrapper = vscodeWrapper !== null && vscodeWrapper !== void 0 ? vscodeWrapper : new vscodeWrapper_1.default();
        this._logger = logger_1.Logger.create(this._vscodeWrapper.outputChannel, "mainController");
        this._serverGroupMgr = serverGroupManager_1.ServerGroupManager.getInstance();
        this._untitledSqlDocumentService = new untitledSqlDocumentService_1.default(this._vscodeWrapper);
        this.configuration = vscode.workspace.getConfiguration();
        userSurvey_1.UserSurvey.createInstance(this._context, this._vscodeWrapper);
    }
    /**
     * Helper method to setup command registrations
     */
    registerCommand(command) {
        const self = this;
        this._context.subscriptions.push(vscode.commands.registerCommand(command, () => self._event.emit(command)));
    }
    /**
     * Helper method to setup command registrations with arguments
     */
    registerCommandWithArgs(command) {
        const self = this;
        this._context.subscriptions.push(vscode.commands.registerCommand(command, (args) => {
            self._event.emit(command, args);
        }));
    }
    /**
     * Disposes the controller
     */
    dispose() {
        void this.deactivate();
    }
    /**
     * Deactivates the extension
     */
    deactivate() {
        return __awaiter(this, void 0, void 0, function* () {
            Utils.logDebug("de-activated.");
            yield this.onDisconnect();
            this._statusview.dispose();
            yield serviceclient_1.default.instance.shutdown();
        });
    }
    get isExperimentalEnabled() {
        return this.configuration.get(Constants.configEnableExperimentalFeatures);
    }
    get isRichExperiencesEnabled() {
        return true;
    }
    /**
     * Initializes the extension
     */
    activate(context) {
        return __awaiter(this, void 0, void 0, function* () {
            // initialize the language client then register the commands
            const didInitialize = yield this.initialize();
            if (didInitialize) {
                // register VS Code commands
                this.registerCommand(Constants.cmdShowExtensionLogs);
                this._event.on(Constants.cmdShowExtensionLogs, () => {
                    this._vscodeWrapper.outputChannel.show(true);
                });
                this.registerCommand(Constants.cmdShowToolsServiceLogs);
                this._event.on(Constants.cmdShowToolsServiceLogs, utils_1.showToolServiceLogs);
                this.registerCommand(Constants.cmdConnect);
                this._event.on(Constants.cmdConnect, () => {
                    void this.runAndLogErrors(this.onNewConnection());
                });
                this.registerCommand(Constants.cmdDisconnect);
                this._event.on(Constants.cmdDisconnect, () => {
                    void this.runAndLogErrors(this.onDisconnect());
                });
                this.registerCommand(Constants.cmdRunQuery);
                this._event.on(Constants.cmdRunQuery, () => {
                    void userSurvey_1.UserSurvey.getInstance().promptUserForNPSFeedback();
                    this._executionPlanOptions.includeEstimatedExecutionPlanXml = false;
                    void this.onRunQuery();
                });
                this.registerCommand(Constants.cmdManageConnectionProfiles);
                this._event.on(Constants.cmdManageConnectionProfiles, () => __awaiter(this, void 0, void 0, function* () {
                    yield this.onManageProfiles();
                }));
                this.registerCommand(Constants.cmdClearPooledConnections);
                this._event.on(Constants.cmdClearPooledConnections, () => __awaiter(this, void 0, void 0, function* () {
                    yield this.onClearPooledConnections();
                }));
                this.registerCommand(Constants.cmdRunCurrentStatement);
                this._event.on(Constants.cmdRunCurrentStatement, () => {
                    void this.onRunCurrentStatement();
                });
                this.registerCommand(Constants.cmdChangeDatabase);
                this._event.on(Constants.cmdChangeDatabase, () => {
                    void this.runAndLogErrors(this.onChooseDatabase());
                });
                this.registerCommand(Constants.cmdChooseDatabase);
                this._event.on(Constants.cmdChooseDatabase, () => {
                    void this.runAndLogErrors(this.onChooseDatabase());
                });
                this.registerCommand(Constants.cmdChooseLanguageFlavor);
                this._event.on(Constants.cmdChooseLanguageFlavor, () => {
                    void this.runAndLogErrors(this.onChooseLanguageFlavor());
                });
                this.registerCommand(Constants.cmdLaunchUserFeedback);
                this._event.on(Constants.cmdLaunchUserFeedback, () => __awaiter(this, void 0, void 0, function* () {
                    yield userSurvey_1.UserSurvey.getInstance().launchSurvey("nps", (0, userSurvey_1.getStandardNPSQuestions)());
                }));
                this.registerCommand(Constants.cmdCancelQuery);
                this._event.on(Constants.cmdCancelQuery, () => {
                    this.onCancelQuery();
                });
                this.registerCommand(Constants.cmdShowGettingStarted);
                this._event.on(Constants.cmdShowGettingStarted, () => __awaiter(this, void 0, void 0, function* () {
                    yield this.launchGettingStartedPage();
                }));
                this.registerCommand(Constants.cmdNewQuery);
                this._event.on(Constants.cmdNewQuery, () => this.runAndLogErrors(this.onNewQuery()));
                this.registerCommand(Constants.cmdRebuildIntelliSenseCache);
                this._event.on(Constants.cmdRebuildIntelliSenseCache, () => {
                    this.onRebuildIntelliSense();
                });
                this.registerCommandWithArgs(Constants.cmdLoadCompletionExtension);
                this._event.on(Constants.cmdLoadCompletionExtension, (params) => {
                    this.onLoadCompletionExtension(params);
                });
                this.registerCommand(Constants.cmdAadRemoveAccount);
                this._event.on(Constants.cmdAadRemoveAccount, () => this.removeAadAccount(this._prompter));
                this.registerCommand(Constants.cmdAadAddAccount);
                this._event.on(Constants.cmdAadAddAccount, () => this.addAadAccount());
                this.registerCommandWithArgs(Constants.cmdClearAzureTokenCache);
                this._event.on(Constants.cmdClearAzureTokenCache, () => this.onClearAzureTokenCache());
                this.registerCommand(Constants.cmdShowExecutionPlanInResults);
                this._event.on(Constants.cmdShowExecutionPlanInResults, () => {
                    this._executionPlanOptions.includeEstimatedExecutionPlanXml = true;
                    void this.onRunQuery();
                });
                this.registerCommand(Constants.cmdEnableActualPlan);
                this._event.on(Constants.cmdEnableActualPlan, () => {
                    this.onToggleActualPlan(true);
                });
                this.registerCommand(Constants.cmdDisableActualPlan);
                this._event.on(Constants.cmdDisableActualPlan, () => {
                    this.onToggleActualPlan(false);
                });
                this.initializeObjectExplorer();
                this.registerCommandWithArgs(Constants.cmdConnectObjectExplorerProfile);
                this._event.on(Constants.cmdConnectObjectExplorerProfile, (profile) => {
                    this._connectionMgr.connectionUI
                        .saveProfile(profile)
                        .then(() => __awaiter(this, void 0, void 0, function* () {
                        yield this.createObjectExplorerSession(profile);
                    }))
                        .catch((err) => {
                        this._vscodeWrapper.showErrorMessage(err);
                    });
                });
                this.registerCommand(Constants.cmdObjectExplorerEnableGroupBySchemaCommand);
                this._event.on(Constants.cmdObjectExplorerEnableGroupBySchemaCommand, () => {
                    vscode.workspace
                        .getConfiguration()
                        .update(Constants.cmdObjectExplorerGroupBySchemaFlagName, true, true);
                });
                this.registerCommand(Constants.cmdObjectExplorerDisableGroupBySchemaCommand);
                this._event.on(Constants.cmdObjectExplorerDisableGroupBySchemaCommand, () => {
                    vscode.workspace
                        .getConfiguration()
                        .update(Constants.cmdObjectExplorerGroupBySchemaFlagName, false, true);
                });
                this.initializeQueryHistory();
                this.sqlTasksService = new sqlTasksService_1.SqlTasksService(serviceclient_1.default.instance, this._untitledSqlDocumentService);
                this.dacFxService = new dacFxService_1.DacFxService(serviceclient_1.default.instance);
                this.sqlProjectsService = new sqlProjectsService_1.SqlProjectsService(serviceclient_1.default.instance);
                this.schemaCompareService = new schemaCompareService_1.SchemaCompareService(serviceclient_1.default.instance);
                const azureResourceController = new azureResourceController_1.AzureResourceController();
                this.azureAccountService = new azureAccountService_1.AzureAccountService(this._connectionMgr.azureController, this._connectionMgr.accountStore);
                this.azureResourceService = new azureResourceService_1.AzureResourceService(this._connectionMgr.azureController, azureResourceController, this._connectionMgr.accountStore);
                this.tableDesignerService = new tableDesignerService_1.TableDesignerService(serviceclient_1.default.instance);
                this.executionPlanService = new executionPlanService_1.ExecutionPlanService(serviceclient_1.default.instance);
                this.schemaDesignerService = new schemaDesignerService_1.SchemaDesignerService(this._context, this._vscodeWrapper, serviceclient_1.default.instance, this._connectionMgr);
                this.schemaDesignerService.registerCommands();
                // Register GitHub Copilot chat participant.
                this.chatService = new chatService_1.ChatService(this._context, serviceclient_1.default.instance, this._vscodeWrapper, this._connectionMgr, () => this._queryHistoryProvider, () => this._queryResultWebviewController);
                this.chatService.registerAgent(context);
                this.chatService.registerCommands((node, content) => this.onNewQuery(node, content), () => this.onNewConnection());
                // Register Copilot tools
                this.toolService = new toolService_1.ToolService(serviceclient_1.default.instance, this._vscodeWrapper, this._connectionMgr, this.schemaDesignerService);
                this.toolService.registerTools(context);
                // Register the PSQL service
                this.psqlService = new psqlService_1.PsqlService(this._context, this._vscodeWrapper, this._connectionMgr);
                this.psqlService.registerCommands(() => this.onNewConnection());
                // Register the Server Create service
                this.serverCreateService = new serverCreateService_1.ServerCreateService(this._context, this._vscodeWrapper, this, this._objectExplorerProvider);
                this.serverCreateService.registerCommands();
                this._queryResultWebviewController.setExecutionPlanService(this.executionPlanService);
                this._queryResultWebviewController.setUntitledDocumentService(this._untitledSqlDocumentService);
                const providerInstance = new this.ExecutionPlanCustomEditorProvider(this._context, this._vscodeWrapper, this.executionPlanService, this._untitledSqlDocumentService);
                vscode.window.registerCustomEditorProvider("pgsql.executionPlanView", providerInstance);
                const self = this;
                const uriHandler = {
                    handleUri(uri) {
                        return __awaiter(this, void 0, void 0, function* () {
                            self._logger.log("Received Uri handler request");
                            try {
                                const protocolHandler = new pgsqlProtocolHandler_1.PgsqlProtocolHandler(self._connectionMgr.client, self._vscodeWrapper);
                                const connectionInfo = yield protocolHandler.handleUri(uri);
                                self._logger.log(`Parsed connection info: ${connectionInfo.server}`);
                                vscode.commands.executeCommand(Constants.cmdAddNewConnection, connectionInfo);
                                (0, telemetry_1.sendActionEvent)(telemetry_2.TelemetryViews.General, telemetry_2.TelemetryActions.UriHandler);
                            }
                            catch (error) {
                                self._logger.error(`Error handling URI: ${(0, utils_1.getErrorMessage)(error)}`);
                                self._vscodeWrapper.showErrorMessage(LocalizedConstants.ProtocolHandler.errorHandlingUri);
                                (0, telemetry_1.sendErrorEvent)(telemetry_2.TelemetryViews.General, telemetry_2.TelemetryActions.UriHandler, error, true);
                            }
                        });
                    },
                };
                vscode.window.registerUriHandler(uriHandler);
                // Add handlers for VS Code generated commands
                this._vscodeWrapper.onDidCloseTextDocument((params) => __awaiter(this, void 0, void 0, function* () { return yield this.onDidCloseTextDocument(params); }));
                this._vscodeWrapper.onDidOpenTextDocument((params) => this.onDidOpenTextDocument(params));
                this._vscodeWrapper.onDidSaveTextDocument((params) => this.onDidSaveTextDocument(params));
                this._vscodeWrapper.onDidChangeConfiguration((params) => this.onDidChangeConfiguration(params));
                vscode.window.onDidChangeVisibleTextEditors((params) => this.onDidChangeVisibleTextEditors(params));
                vscode.workspace.onDidRenameFiles((params) => this.onDidRenameFiles(params));
                // Register server group commands
                this._serverGroupMgr.registerCommands(this._context, this._vscodeWrapper, this._objectExplorerProvider, this._connectionMgr.connectionStore);
                this._connectionLensMgr = new connectionLensManager_1.ConnectionLensManager(context, this._connectionMgr);
                this._connectionLensMgr.activate();
                return true;
            }
        });
    }
    /**
     * Helper to script a node based on the script operation
     */
    scriptNode(node_1, operation_1) {
        return __awaiter(this, arguments, void 0, function* (node, operation, executeScript = false) {
            const nodeUri = objectExplorerUtils_1.ObjectExplorerUtils.getNodeUri(node);
            const connectionCreds = this._objectExplorerProvider.getConnectionCredentials(node.sessionId);
            const databaseName = objectExplorerUtils_1.ObjectExplorerUtils.getDatabaseName(node);
            // if not connected or different database
            if (!this.connectionManager.isConnected(nodeUri) ||
                connectionCreds.database !== databaseName) {
                // make a new connection
                connectionCreds.database = databaseName;
                if (!this.connectionManager.isConnecting(nodeUri)) {
                    const promise = new protocol_1.Deferred();
                    yield this.connectionManager.connect(nodeUri, connectionCreds, promise);
                    yield promise;
                }
            }
            const selectStatement = yield this._scriptingService.script(node, nodeUri, operation);
            const editor = yield this._untitledSqlDocumentService.newQuery(selectStatement);
            let uri = editor.document.uri.toString(true);
            let scriptingObject = this._scriptingService.getObjectFromNode(node);
            let title = `${scriptingObject.schema}.${scriptingObject.name}`;
            const queryUriPromise = new protocol_1.Deferred();
            yield this.connectionManager.connect(uri, connectionCreds, queryUriPromise);
            // The token, expiry, or password may have been updated on the
            // connection while the connection was being established.
            this.updateAuthCredentials(connectionCreds, node);
            yield queryUriPromise;
            this._statusview.languageFlavorChanged(uri, Constants.pgsqlProviderName);
            this._statusview.sqlCmdModeChanged(uri, false);
            if (executeScript) {
                const queryPromise = new protocol_1.Deferred();
                yield this._outputContentProvider.runQuery(this._statusview, uri, undefined, title, {}, queryPromise);
                yield queryPromise;
                yield this.connectionManager.connectionStore.removeRecentlyUsed(connectionCreds);
            }
            let scriptType;
            switch (operation) {
                case scriptingRequest_1.ScriptOperation.Select:
                    scriptType = "Select";
                    break;
                case scriptingRequest_1.ScriptOperation.Create:
                    scriptType = "Create";
                    break;
                case scriptingRequest_1.ScriptOperation.Insert:
                    scriptType = "Insert";
                    break;
                case scriptingRequest_1.ScriptOperation.Update:
                    scriptType = "Update";
                    break;
                case scriptingRequest_1.ScriptOperation.Delete:
                    scriptType = "Delete";
                    break;
                case scriptingRequest_1.ScriptOperation.Execute:
                    scriptType = "Execute";
                    break;
                case scriptingRequest_1.ScriptOperation.Alter:
                    scriptType = "Alter";
                    break;
                default:
                    scriptType = "Unknown";
                    break;
            }
            (0, telemetry_1.sendActionEvent)(telemetry_2.TelemetryViews.QueryEditor, telemetry_2.TelemetryActions.ScriptAsQuery, {
                isScriptExecuted: executeScript.toString(),
                objectType: node.nodeType,
                operation: scriptType,
            }, undefined, connectionCreds, this.connectionManager.getServerInfo(connectionCreds));
        });
    }
    // The token and expiry may have been updated on the connection when the
    // connection was established. Update only those fields so subsequent
    // connections to the same server do not require refreshing the token.
    updateAuthCredentials(connectionCreds, node) {
        const canonical = this._objectExplorerProvider.getConnectionCredentials(node.sessionId);
        this._objectExplorerProvider.updateConnectionCredentials(node.sessionId, Object.assign(Object.assign({}, canonical), { azureAccountToken: connectionCreds.azureAccountToken, expiresOn: connectionCreds.expiresOn, password: connectionCreds.password }));
        node.updateConnectionInfo(connectionCreds);
    }
    /**
     * Returns a flag indicating if the extension is initialized
     */
    isInitialized() {
        return this._initialized;
    }
    /**
     * Initializes the extension
     */
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            // initialize language service client
            yield serviceclient_1.default.instance.initialize(this._context);
            // Init status bar
            this._statusview = new statusView_1.default(this._vscodeWrapper);
            // Init CodeAdapter for use when user response to questions is needed
            this._prompter = new adapter_1.default(this._vscodeWrapper);
            // Init Query Results Webview Controller
            this._queryResultWebviewController = new queryResultWebViewController_1.QueryResultWebviewController(this._context, this._vscodeWrapper, this.executionPlanService, this.untitledSqlDocumentService);
            // Init content provider for results pane
            this._outputContentProvider = new sqlOutputContentProvider_1.SqlOutputContentProvider(this._context, this._statusview, this._vscodeWrapper);
            this._outputContentProvider.setQueryResultWebviewController(this._queryResultWebviewController);
            this._queryResultWebviewController.setSqlOutputContentProvider(this._outputContentProvider);
            // Init connection manager and connection MRU
            this._connectionMgr = new connectionManager_1.default(this._context, this._statusview, this._prompter);
            void this.showOnLaunchPrompts();
            // Handle case where SQL file is the 1st opened document
            const activeTextEditor = this._vscodeWrapper.activeTextEditor;
            if (activeTextEditor && this._vscodeWrapper.isEditingSqlFile) {
                this.onDidOpenTextDocument(activeTextEditor.document);
            }
            yield this.sanitizeConnectionProfiles();
            // TODO-PG: Reenable after PTS has credential/* handlers implemented
            // await this.loadTokenCache();
            Utils.logDebug("activated.");
            this._initialized = true;
            return true;
        });
    }
    // TODO-PG: Reenable after PTS has credential/* handlers implemented
    // private async loadTokenCache(): Promise<void> {
    //     await this._connectionMgr.azureController.loadTokenCache();
    // }
    /**
     * Sanitize the connection profiles in the settings.
     */
    sanitizeConnectionProfiles() {
        return __awaiter(this, void 0, void 0, function* () {
            const sanitize = (connectionProfiles, target) => __awaiter(this, void 0, void 0, function* () {
                let profileChanged = false;
                for (const conn of connectionProfiles) {
                    // remove azure account token
                    if (conn &&
                        conn.authenticationType !== "AzureMFA" &&
                        conn.azureAccountToken !== undefined) {
                        conn.azureAccountToken = undefined;
                        profileChanged = true;
                    }
                    // remove password
                    if (!Utils.isEmpty(conn.password)) {
                        // save the password in the credential store if save password is true
                        yield this.connectionManager.connectionStore.saveProfilePasswordIfNeeded(conn);
                        conn.password = "";
                        profileChanged = true;
                    }
                    // Fixup 'Encrypt' property if needed
                    let result = ConnInfo.updateEncrypt(conn);
                    if (result.updateStatus) {
                        yield this.connectionManager.connectionStore.saveProfile(result.connection);
                    }
                }
                if (profileChanged) {
                    yield this._vscodeWrapper.setConfiguration(Constants.extensionName, Constants.connectionsArrayName, connectionProfiles, target);
                }
            });
            const profileMapping = new Map();
            const configuration = this._vscodeWrapper.getConfiguration(Constants.extensionName, this._vscodeWrapper.activeTextEditorUri);
            const configValue = configuration.inspect(Constants.connectionsArrayName);
            profileMapping.set(vscode.ConfigurationTarget.Global, configValue.globalValue || []);
            profileMapping.set(vscode.ConfigurationTarget.Workspace, configValue.workspaceValue || []);
            profileMapping.set(vscode.ConfigurationTarget.WorkspaceFolder, configValue.workspaceFolderValue || []);
            for (const target of profileMapping.keys()) {
                // sanitize the connections and save them back to their original target.
                yield sanitize(profileMapping.get(target), target);
            }
        });
    }
    /**
     * Creates a new Object Explorer session
     * @param connectionCredentials Connection credentials to use for the session
     * @returns True if the session was created successfully, false otherwise
     */
    createObjectExplorerSession(connectionCredentials) {
        return __awaiter(this, void 0, void 0, function* () {
            // Show notification-style popup with loading indicator
            return yield vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: LocalizedConstants.connectProgressNoticationTitle,
                cancellable: false,
            }, () => __awaiter(this, void 0, void 0, function* () {
                let createSessionPromise = new protocol_1.Deferred();
                const connectionDetails = connectionCredentials_1.ConnectionCredentials.createConnectionDetails(connectionCredentials);
                // Don't attempt to create a new object explorer session if
                // one already exists. This will ultimately hang, because the
                // Tools Service will not send the "objectexplorer/sessioncreated"
                // notification, as it already has created it.
                const expectedSessionId = yield this._objectExplorerProvider.objectExplorerService.getSessionId(connectionDetails);
                const isExistingSession = this._objectExplorerProvider.objectExplorerService.doesSessionExist(expectedSessionId);
                if (isExistingSession) {
                    this._logger.log(`An existing OE session was found for ${expectedSessionId}`);
                    return true;
                }
                const sessionId = yield this._objectExplorerProvider.createSession(createSessionPromise, connectionCredentials, this._context);
                if (!sessionId) {
                    return false;
                }
                const newNode = yield createSessionPromise;
                if (newNode) {
                    this._objectExplorerProvider.refresh(undefined);
                    return true;
                }
                return false;
            }));
        });
    }
    /**
     * TODO: remove this method an unify with this.createObjectExplorerSession
     */
    createObjectExplorerSessionFromDialog(connectionCredentials) {
        return __awaiter(this, void 0, void 0, function* () {
            let createSessionPromise = new protocol_1.Deferred();
            const sessionId = yield this._objectExplorerProvider.createSession(createSessionPromise, connectionCredentials, this._context);
            if (sessionId) {
                const newNode = yield createSessionPromise;
                if (newNode) {
                    this._logger.log(`New Session Dialog: Node created for ${connectionCredentials === null || connectionCredentials === void 0 ? void 0 : connectionCredentials.id}`);
                    this._objectExplorerProvider.refresh(undefined);
                    return newNode;
                }
                this._logger.log(`New Session Dialog: No node returned for ${connectionCredentials === null || connectionCredentials === void 0 ? void 0 : connectionCredentials.id}, returned empty node`);
            }
            this._logger.log(`New Session Dialog: Got session id: ${!!sessionId}, returned empty node`);
            return undefined;
        });
    }
    /**
     * Initializes the Object Explorer commands
     */
    initializeObjectExplorer() {
        const self = this;
        // Register the object explorer tree provider
        this._objectExplorerProvider = new objectExplorerProvider_1.ObjectExplorerProvider(this._vscodeWrapper, this._connectionMgr);
        this.objectExplorerTree = vscode.window.createTreeView("pg-objectExplorer", {
            treeDataProvider: this._objectExplorerProvider,
            canSelectMany: false,
            showCollapseAll: true,
            dragAndDropController: new objectExplorerDragAndDropController_1.ObjectExplorerDragAndDropController(this._objectExplorerProvider),
        });
        this._context.subscriptions.push(this.objectExplorerTree);
        // Register the server filter filter commands
        this._objectExplorerProvider.registerFilterCommands(this._context);
        // Sets the correct current node on any node selection
        this._context.subscriptions.push(this.objectExplorerTree.onDidChangeSelection((e) => {
            var _a;
            if (((_a = e.selection) === null || _a === void 0 ? void 0 : _a.length) > 0) {
                self._objectExplorerProvider.currentNode = e.selection[0];
            }
        }));
        // Old style Add connection when experimental features are not enabled
        // Add Object Explorer Node
        this.registerCommandWithArgs(Constants.cmdAddNewConnection);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this._event.on(Constants.cmdAddNewConnection, (args) => __awaiter(this, void 0, void 0, function* () {
            if (!this.isRichExperiencesEnabled) {
                if (!self._objectExplorerProvider.objectExplorerExists) {
                    self._objectExplorerProvider.objectExplorerExists = true;
                }
                yield self.createObjectExplorerSession();
            }
            else {
                let connectionInfo = undefined;
                let groupId = undefined;
                if (args) {
                    // validate that `args` is an IConnectionInfo before assigning
                    if ((0, utils_1.isIConnectionInfo)(args)) {
                        connectionInfo = args;
                    }
                    else if (args instanceof treeNodeInfo_1.ServerGroupNodeInfo) {
                        groupId = args.id;
                    }
                }
                const connDialog = new connectionDialogWebviewController_1.ConnectionDialogWebviewController(this._context, this._vscodeWrapper, this, this._objectExplorerProvider, connectionInfo, groupId);
                connDialog.revealToForeground();
            }
        }));
        // Object Explorer New Query
        this._context.subscriptions.push(vscode.commands.registerCommand(Constants.cmdObjectExplorerNewQuery, (treeNodeInfo) => __awaiter(this, void 0, void 0, function* () {
            this._objectExplorerProvider.syncConnectionAuthFields(treeNodeInfo);
            const connectionCredentials = treeNodeInfo.connectionInfo;
            const databaseName = objectExplorerUtils_1.ObjectExplorerUtils.getDatabaseName(treeNodeInfo);
            if (databaseName !== connectionCredentials.database &&
                databaseName !== LocalizedConstants.defaultDatabaseLabel) {
                connectionCredentials.database = databaseName;
            }
            else if (databaseName === LocalizedConstants.defaultDatabaseLabel) {
                connectionCredentials.database = "";
            }
            treeNodeInfo.updateConnectionInfo(connectionCredentials);
            yield self.onNewQuery(treeNodeInfo);
        })));
        // Remove Object Explorer Node
        this._context.subscriptions.push(vscode.commands.registerCommand(Constants.cmdRemoveObjectExplorerNode, (treeNodeInfo) => __awaiter(this, void 0, void 0, function* () {
            const confirmRemoval = yield vscode.window.showWarningMessage(vscode.l10n.t("Are you sure you want to remove this connection?"), { modal: true }, vscode.l10n.t("Yes"));
            if (confirmRemoval !== vscode.l10n.t("Yes")) {
                return;
            }
            yield this._objectExplorerProvider.removeObjectExplorerNode(treeNodeInfo);
            let profile = treeNodeInfo.connectionInfo;
            yield this._connectionMgr.connectionStore.removeProfile(profile, false);
            return this._objectExplorerProvider.refresh(undefined);
        })));
        // Refresh Object Explorer Node
        this._context.subscriptions.push(vscode.commands.registerCommand(Constants.cmdRefreshObjectExplorerNode, (treeNodeInfo) => __awaiter(this, void 0, void 0, function* () {
            yield this._objectExplorerProvider.refreshNode(treeNodeInfo);
        })));
        // Sign In into Object Explorer Node
        this._context.subscriptions.push(vscode.commands.registerCommand(Constants.cmdObjectExplorerNodeSignIn, (node) => __awaiter(this, void 0, void 0, function* () {
            let profile = node.parentNode.connectionInfo;
            profile =
                yield self.connectionManager.connectionUI.promptForRetryCreateProfile(profile);
            if (profile) {
                node.parentNode.updateConnectionInfo(profile);
                self._objectExplorerProvider.updateNode(node.parentNode);
                self._objectExplorerProvider.signInNodeServer(node.parentNode);
                return self._objectExplorerProvider.refresh(undefined);
            }
        })));
        // Connect nodes are added as children of Object Explorer server nodes
        // when there is a connection error. They instruct the user to try again, after
        // fixing the underlying issue (e.g., service not running or firewall issue).
        this._context.subscriptions.push(vscode.commands.registerCommand(Constants.cmdConnectObjectExplorerNode, (node) => __awaiter(this, void 0, void 0, function* () {
            // The parent node of a ConnectTreeNode is a disconnected "server node".
            const serverNode = node === null || node === void 0 ? void 0 : node.parentNode;
            if (!serverNode) {
                return;
            }
            // Refreshing the server node will initiate the same experience
            // as if it had been attempted to be expanded by the user, including
            // the loading indicators in the treeview.
            this._objectExplorerProvider.refresh(serverNode, true);
        })));
        // Disconnect Object Explorer Node
        this._context.subscriptions.push(vscode.commands.registerCommand(Constants.cmdDisconnectObjectExplorerNode, (node) => __awaiter(this, void 0, void 0, function* () {
            yield this._objectExplorerProvider.removeObjectExplorerNode(node, true);
            return this._objectExplorerProvider.refresh(undefined);
        })));
        if (this.isRichExperiencesEnabled) {
            this._context.subscriptions.push(vscode.commands.registerCommand(Constants.cmdSchemaCompare, (node) => __awaiter(this, void 0, void 0, function* () { return this.onSchemaCompare(node); })));
            this._context.subscriptions.push(vscode.commands.registerCommand(Constants.cmdEditConnection, (node) => __awaiter(this, void 0, void 0, function* () {
                const connDialog = new connectionDialogWebviewController_1.ConnectionDialogWebviewController(this._context, this._vscodeWrapper, this, this._objectExplorerProvider, node.connectionInfo);
                connDialog.revealToForeground();
            })));
            this._context.subscriptions.push(vscode.commands.registerCommand(Constants.cmdNewTable, (node) => __awaiter(this, void 0, void 0, function* () {
                const reactPanel = new tableDesignerWebviewController_1.TableDesignerWebviewController(this._context, this._vscodeWrapper, this.tableDesignerService, this._connectionMgr, this._untitledSqlDocumentService, node, this._objectExplorerProvider, this.objectExplorerTree);
                reactPanel.revealToForeground();
            })));
            this._context.subscriptions.push(vscode.commands.registerCommand(Constants.cmdEditTable, (node) => __awaiter(this, void 0, void 0, function* () {
                const reactPanel = new tableDesignerWebviewController_1.TableDesignerWebviewController(this._context, this._vscodeWrapper, this.tableDesignerService, this._connectionMgr, this._untitledSqlDocumentService, node, this._objectExplorerProvider, this.objectExplorerTree);
                reactPanel.revealToForeground();
            })));
            const filterNode = (node) => __awaiter(this, void 0, void 0, function* () {
                const filters = yield objectExplorerFilter_1.ObjectExplorerFilter.getFilters(this._context, this._vscodeWrapper, node);
                if (filters) {
                    node.filters = filters;
                    if (node.collapsibleState === vscode.TreeItemCollapsibleState.Collapsed) {
                        yield this._objectExplorerProvider.refreshNode(node);
                    }
                    else if (node.collapsibleState === vscode.TreeItemCollapsibleState.Expanded) {
                        yield this._objectExplorerProvider.expandNode(node, node.sessionId, undefined);
                    }
                    yield this.safeRevealInObjectExplorer(node, {
                        select: true,
                        focus: true,
                        expand: true,
                    });
                }
                else {
                    // User cancelled the operation. Do nothing and focus on the node
                    yield this.safeRevealInObjectExplorer(node, {
                        select: true,
                        focus: true,
                    });
                    return;
                }
            });
            this._context.subscriptions.push(vscode.commands.registerCommand(Constants.cmdFilterNode, filterNode));
            this._context.subscriptions.push(vscode.commands.registerCommand(Constants.cmdFilterNodeWithExistingFilters, filterNode));
            this._context.subscriptions.push(vscode.window.registerWebviewViewProvider(Constants.resultsViewerViewId, this._queryResultWebviewController));
        }
        // Initiate the scripting service
        this._scriptingService = new scriptingService_1.ScriptingService(this._connectionMgr);
        // Script as Select
        this._context.subscriptions.push(vscode.commands.registerCommand(Constants.cmdScriptSelect, (node) => __awaiter(this, void 0, void 0, function* () {
            yield this.scriptNode(node, scriptingRequest_1.ScriptOperation.Select, true);
            userSurvey_1.UserSurvey.getInstance().promptUserForNPSFeedback();
        })));
        // Script as Create
        this._context.subscriptions.push(vscode.commands.registerCommand(Constants.cmdScriptCreate, (node) => __awaiter(this, void 0, void 0, function* () { return yield this.scriptNode(node, scriptingRequest_1.ScriptOperation.Create); })));
        // Script as Drop
        this._context.subscriptions.push(vscode.commands.registerCommand(Constants.cmdScriptDelete, (node) => __awaiter(this, void 0, void 0, function* () { return yield this.scriptNode(node, scriptingRequest_1.ScriptOperation.Delete); })));
        // Script as Execute
        this._context.subscriptions.push(vscode.commands.registerCommand(Constants.cmdScriptExecute, (node) => __awaiter(this, void 0, void 0, function* () { return yield this.scriptNode(node, scriptingRequest_1.ScriptOperation.Execute); })));
        // Script as Alter
        this._context.subscriptions.push(vscode.commands.registerCommand(Constants.cmdScriptAlter, (node) => __awaiter(this, void 0, void 0, function* () { return yield this.scriptNode(node, scriptingRequest_1.ScriptOperation.Alter); })));
        // Copy object name command
        this._context.subscriptions.push(vscode.commands.registerCommand(Constants.cmdCopyObjectName, () => __awaiter(this, void 0, void 0, function* () {
            let node = this._objectExplorerProvider.currentNode;
            // Folder node
            if (node.context.type === Constants.folderLabel) {
                return;
            }
            else if (node.context.type === Constants.serverLabel ||
                node.context.type === Constants.disconnectedServerNodeType) {
                const label = typeof node.label === "string" ? node.label : node.label.label;
                yield this._vscodeWrapper.clipboardWriteText(label);
            }
            else {
                let scriptingObject = this._scriptingService.getObjectFromNode(node);
                const escapedName = Utils.escapeClosingBrackets(scriptingObject.name);
                if (scriptingObject.schema) {
                    let database = objectExplorerUtils_1.ObjectExplorerUtils.getDatabaseName(node);
                    const databaseName = Utils.escapeClosingBrackets(database);
                    const escapedSchema = Utils.escapeClosingBrackets(scriptingObject.schema);
                    yield this._vscodeWrapper.clipboardWriteText(`[${databaseName}].${escapedSchema}.[${escapedName}]`);
                }
                else {
                    yield this._vscodeWrapper.clipboardWriteText(`[${escapedName}]`);
                }
            }
        })));
        // Reveal Query Results command
        this._context.subscriptions.push(vscode.commands.registerCommand(Constants.cmdrevealQueryResultPanel, () => {
            vscode.commands.executeCommand(`${Constants.resultsViewerViewId}.focus`, {
                preserveFocus: true,
            });
        }));
        // Query Results copy messages command
        this._context.subscriptions.push(vscode.commands.registerCommand(Constants.cmdCopyAll, (context) => __awaiter(this, void 0, void 0, function* () {
            if (context) {
                const uri = context.uri;
                yield this._queryResultWebviewController.copyAllMessagesToClipboard(uri);
            }
        })));
    }
    /**
     * Initializes the Query History commands
     */
    initializeQueryHistory() {
        let config = this._vscodeWrapper.getConfiguration(Constants.extensionConfigSectionName);
        let queryHistoryFeature = config.get(Constants.configEnableQueryHistoryFeature);
        // If the query history feature is enabled
        if (queryHistoryFeature && !this._queryHistoryRegistered) {
            // Register the query history tree provider
            this._queryHistoryProvider = new queryHistoryProvider_1.QueryHistoryProvider(this._connectionMgr, this._outputContentProvider, this._vscodeWrapper, this._untitledSqlDocumentService, this._statusview, this._prompter);
            this._context.subscriptions.push(vscode.window.registerTreeDataProvider("pg-queryHistory", this._queryHistoryProvider));
            // Command to refresh Query History
            this._context.subscriptions.push(vscode.commands.registerCommand(Constants.cmdRefreshQueryHistory, (ownerUri, hasError) => {
                config = this._vscodeWrapper.getConfiguration(Constants.extensionConfigSectionName);
                let queryHistoryFeatureEnabled = config.get(Constants.configEnableQueryHistoryFeature);
                let queryHistoryCaptureEnabled = config.get(Constants.configEnableQueryHistoryCapture);
                if (queryHistoryFeatureEnabled && queryHistoryCaptureEnabled) {
                    const timeStamp = new Date();
                    this._queryHistoryProvider.refresh(ownerUri, timeStamp, hasError);
                }
            }));
            // Command to enable clear all entries in Query History
            this._context.subscriptions.push(vscode.commands.registerCommand(Constants.cmdClearAllQueryHistory, () => {
                this._queryHistoryProvider.clearAll();
            }));
            // Command to enable delete an entry in Query History
            this._context.subscriptions.push(vscode.commands.registerCommand(Constants.cmdDeleteQueryHistory, (node) => {
                this._queryHistoryProvider.deleteQueryHistoryEntry(node);
            }));
            // Command to enable open a query in Query History
            this._context.subscriptions.push(vscode.commands.registerCommand(Constants.cmdOpenQueryHistory, (node) => __awaiter(this, void 0, void 0, function* () {
                yield this._queryHistoryProvider.openQueryHistoryEntry(node);
            })));
            // Command to copy query from Query History
            this._context.subscriptions.push(vscode.commands.registerCommand(Constants.cmdCopyQueryHistory, (node) => __awaiter(this, void 0, void 0, function* () {
                yield this._queryHistoryProvider.copyQueryHistoryEntry(node);
            })));
            // Command to enable run a query in Query History
            this._context.subscriptions.push(vscode.commands.registerCommand(Constants.cmdRunQueryHistory, (node) => __awaiter(this, void 0, void 0, function* () {
                yield this._queryHistoryProvider.openQueryHistoryEntry(node, true);
            })));
            // Command to start the query history capture
            this._context.subscriptions.push(vscode.commands.registerCommand(Constants.cmdStartQueryHistory, (node) => __awaiter(this, void 0, void 0, function* () {
                yield this._queryHistoryProvider.startQueryHistoryCapture();
            })));
            // Command to pause the query history capture
            this._context.subscriptions.push(vscode.commands.registerCommand(Constants.cmdPauseQueryHistory, (node) => __awaiter(this, void 0, void 0, function* () {
                yield this._queryHistoryProvider.pauseQueryHistoryCapture();
            })));
            // Command to open the query history experience in the command palette
            this._context.subscriptions.push(vscode.commands.registerCommand(Constants.cmdCommandPaletteQueryHistory, () => __awaiter(this, void 0, void 0, function* () {
                yield this._queryHistoryProvider.showQueryHistoryCommandPalette();
            })));
            this._queryHistoryRegistered = true;
        }
    }
    /**
     * Handles the command to cancel queries
     */
    onCancelQuery() {
        if (!this.canRunCommand() || !this.validateTextDocumentHasFocus()) {
            return;
        }
        try {
            let uri = this._vscodeWrapper.activeTextEditorUri;
            this._outputContentProvider.cancelQuery(uri);
        }
        catch (err) {
            console.warn(`Unexpected error cancelling query : ${(0, utils_1.getErrorMessage)(err)}`);
        }
    }
    /**
     * Choose a new database from the current server
     */
    onChooseDatabase() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.canRunCommand() && this.validateTextDocumentHasFocus()) {
                const success = yield this._connectionMgr.onChooseDatabase();
                return success;
            }
            return false;
        });
    }
    /**
     * Choose a language flavor for the SQL document. Should be either "MSSQL" or "Other"
     * to indicate that intellisense and other services should not be provided
     */
    onChooseLanguageFlavor() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.canRunCommand() && this.validateTextDocumentHasFocus()) {
                const fileUri = this._vscodeWrapper.activeTextEditorUri;
                if (fileUri && this._vscodeWrapper.isEditingSqlFile) {
                    void this._connectionMgr.onChooseLanguageFlavor();
                }
                else {
                    this._vscodeWrapper.showWarningMessage(LocalizedConstants.msgOpenSqlFile);
                }
            }
            return false;
        });
    }
    /**
     * Close active connection, if any
     */
    onDisconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.canRunCommand() && this.validateTextDocumentHasFocus()) {
                let fileUri = this._vscodeWrapper.activeTextEditorUri;
                let queryRunner = this._outputContentProvider.getQueryRunner(fileUri);
                if (queryRunner && queryRunner.isExecutingQuery) {
                    this._outputContentProvider.cancelQuery(fileUri);
                }
                const success = yield this._connectionMgr.onDisconnect();
                if (success) {
                    vscode.commands.executeCommand("setContext", "pgsql.editorConnected", false);
                }
                return success;
            }
            return false;
        });
    }
    /**
     * Manage connection profiles (create, edit, remove).
     * Public for testing purposes
     */
    onManageProfiles() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.canRunCommand()) {
                yield this._connectionMgr.onManageProfiles();
                return;
            }
        });
    }
    /**
     * Clears all pooled connections not in active use.
     */
    onClearPooledConnections() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.canRunCommand()) {
                yield this._connectionMgr.onClearPooledConnections();
                return;
            }
        });
    }
    /**
     * Let users pick from a list of connections
     */
    onNewConnection() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.canRunCommand() && this.validateTextDocumentHasFocus()) {
                return yield this.showConnectionsListandNewConnectionOption();
            }
            return false;
        });
    }
    showConnectionsListandNewConnectionOption() {
        return __awaiter(this, void 0, void 0, function* () {
            const connectionProfileList = yield this._connectionMgr.connectionStore.getPickListItems();
            const selection = yield this._connectionMgr.connectionUI.promptForConnection(connectionProfileList);
            if (selection) {
                if (selection.quickPickItemType === interfaces_1.CredentialsQuickPickItemType.NewConnection) {
                    // Workflow to create a new connection: Dialog instead of Prompt
                    const connDialog = new connectionDialogWebviewController_1.ConnectionDialogWebviewController(this._context, this._vscodeWrapper, this, this._objectExplorerProvider);
                    connDialog.revealToForeground();
                    return true;
                }
                else {
                    // User selected a connection from the list
                    let credentials = yield this._connectionMgr.onOldConnection(selection);
                    if (credentials) {
                        yield this.createObjectExplorerSession(credentials);
                        return true;
                    }
                }
            }
            else {
                return false;
            }
        });
    }
    /**
     * Clear and rebuild the IntelliSense cache
     */
    onRebuildIntelliSense() {
        if (this.canRunCommand() && this.validateTextDocumentHasFocus()) {
            const fileUri = this._vscodeWrapper.activeTextEditorUri;
            if (fileUri && this._vscodeWrapper.isEditingSqlFile) {
                this._statusview.languageServiceStatusChanged(fileUri, LocalizedConstants.updatingIntelliSenseStatus);
                serviceclient_1.default.instance.sendNotification(languageService_1.RebuildIntelliSenseNotification.type, {
                    ownerUri: fileUri,
                });
            }
            else {
                this._vscodeWrapper.showWarningMessage(LocalizedConstants.msgOpenSqlFile);
            }
        }
    }
    /**
     * Send completion extension load request to language service
     */
    onLoadCompletionExtension(params) {
        serviceclient_1.default.instance.sendRequest(languageService_1.CompletionExtLoadRequest.type, params);
    }
    /**
     * execute the SQL statement for the current cursor position
     */
    onRunCurrentStatement(callbackThis) {
        return __awaiter(this, void 0, void 0, function* () {
            // the 'this' context is lost in retry callback, so capture it here
            let self = callbackThis ? callbackThis : this;
            try {
                if (!self.canRunCommand()) {
                    return;
                }
                if (!self.canRunV2Command()) {
                    // Notify the user that this is not supported on this version
                    yield this._vscodeWrapper.showErrorMessage(LocalizedConstants.macSierraRequiredErrorMessage);
                    return;
                }
                if (!self.validateTextDocumentHasFocus()) {
                    return;
                }
                // check if we're connected and editing a SQL file
                if (yield self.isRetryRequiredBeforeQuery(self.onRunCurrentStatement)) {
                    return;
                }
                let editor = self._vscodeWrapper.activeTextEditor;
                let uri = self._vscodeWrapper.activeTextEditorUri;
                let title = path.basename(editor.document.fileName);
                // return early if the document does contain any text
                if (editor.document.getText(undefined).trim().length === 0) {
                    return;
                }
                // only the start line and column are used to determine the current statement
                let querySelection = {
                    startLine: editor.selection.start.line,
                    startColumn: editor.selection.start.character,
                    endLine: 0,
                    endColumn: 0,
                };
                yield self._outputContentProvider.runCurrentStatement(self._statusview, uri, querySelection, title);
            }
            catch (err) {
                console.warn(`Unexpected error running current statement : ${err}`);
            }
        });
    }
    /**
     * get the T-SQL query from the editor, run it and show output
     */
    onRunQuery(callbackThis) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            // the 'this' context is lost in retry callback, so capture it here
            let self = callbackThis ? callbackThis : this;
            try {
                if (!self.canRunCommand() || !self.validateTextDocumentHasFocus()) {
                    return;
                }
                // check if we're connected and editing a SQL file
                if (yield self.isRetryRequiredBeforeQuery(self.onRunQuery)) {
                    return;
                }
                let editor = self._vscodeWrapper.activeTextEditor;
                let uri = self._vscodeWrapper.activeTextEditorUri;
                if (self._queryResultWebviewController) {
                    self._executionPlanOptions.includeActualExecutionPlanXml =
                        self._queryResultWebviewController.actualPlanStatuses.includes(uri);
                }
                else {
                    self._executionPlanOptions.includeActualExecutionPlanXml = false;
                }
                // Do not execute when there are multiple selections in the editor until it can be properly handled.
                // Otherwise only the first selection will be executed and cause unexpected issues.
                if (((_a = editor.selections) === null || _a === void 0 ? void 0 : _a.length) > 1) {
                    self._vscodeWrapper.showErrorMessage(LocalizedConstants.msgMultipleSelectionModeNotSupported);
                    return;
                }
                // create new connection
                if (!self.connectionManager.isConnected(uri)) {
                    yield self.onNewConnection();
                    (0, telemetry_1.sendActionEvent)(telemetry_2.TelemetryViews.QueryEditor, telemetry_2.TelemetryActions.CreateConnection);
                }
                // check if current connection is still valid / active - if not, refresh azure account token
                yield self._connectionMgr.refreshAzureAccountToken(uri);
                let title = path.basename(editor.document.fileName);
                let querySelection;
                // Calculate the selection if we have a selection, otherwise we'll treat null as
                // the entire document's selection
                if (!editor.selection.isEmpty) {
                    let selection = editor.selection;
                    querySelection = {
                        startLine: selection.start.line,
                        startColumn: selection.start.character,
                        endLine: selection.end.line,
                        endColumn: selection.end.character,
                    };
                }
                // Trim down the selection. If it is empty after selecting, then we don't execute
                let selectionToTrim = editor.selection.isEmpty ? undefined : editor.selection;
                if (editor.document.getText(selectionToTrim).trim().length === 0) {
                    return;
                }
                // Delete query result filters for the current uri when we run a new query
                singletonStore_1.default.delete(uri);
                yield self._outputContentProvider.runQuery(self._statusview, uri, querySelection, title, self._executionPlanOptions);
            }
            catch (err) {
                console.warn(`Unexpected error running query : ${err}`);
            }
        });
    }
    /**
     * Check if the state is ready to execute a query and retry
     * the query execution method if needed
     */
    isRetryRequiredBeforeQuery(retryMethod) {
        return __awaiter(this, void 0, void 0, function* () {
            let self = this;
            let result = undefined;
            try {
                if (!self._vscodeWrapper.isEditingSqlFile) {
                    // Prompt the user to change the language mode to SQL before running a query
                    result = yield self._connectionMgr.connectionUI.promptToChangeLanguageMode();
                }
                else if (!self._connectionMgr.isConnected(self._vscodeWrapper.activeTextEditorUri)) {
                    result = yield self.onNewConnection();
                }
                if (result) {
                    yield retryMethod(self);
                    return true;
                }
                else {
                    // we don't need to do anything to configure environment before running query
                    return false;
                }
            }
            catch (err) {
                yield self._vscodeWrapper.showErrorMessage(LocalizedConstants.msgError + err);
            }
        });
    }
    /**
     * Executes a callback and logs any errors raised
     */
    runAndLogErrors(promise) {
        let self = this;
        return promise.catch((err) => {
            self._vscodeWrapper.showErrorMessage(LocalizedConstants.msgError + err);
            return undefined;
        });
    }
    onToggleActualPlan(isEnable) {
        const uri = this._vscodeWrapper.activeTextEditorUri;
        let actualPlanStatuses = this._queryResultWebviewController.actualPlanStatuses;
        // adds the current uri to the list of uris with actual plan enabled
        // or removes the uri if the user is disabling it
        if (isEnable && !actualPlanStatuses.includes(uri)) {
            actualPlanStatuses.push(uri);
        }
        else {
            this._queryResultWebviewController.actualPlanStatuses = actualPlanStatuses.filter((statusUri) => statusUri != uri);
        }
        // sets the vscode context variable associated with the
        // actual plan statuses; this is used in the package.json to
        // know when to change the enabling/disabling icon
        void vscode.commands.executeCommand("setContext", "pgsql.executionPlan.urisWithActualPlanEnabled", this._queryResultWebviewController.actualPlanStatuses);
    }
    /**
     * Access the connection manager for testing
     */
    get connectionManager() {
        return this._connectionMgr;
    }
    set connectionManager(connectionManager) {
        this._connectionMgr = connectionManager;
    }
    set untitledSqlDocumentService(untitledSqlDocumentService) {
        this._untitledSqlDocumentService = untitledSqlDocumentService;
    }
    /**
     * Verifies the extension is initilized and if not shows an error message
     */
    canRunCommand() {
        if (this._connectionMgr === undefined) {
            Utils.showErrorMsg(LocalizedConstants.extensionNotInitializedError);
            return false;
        }
        return true;
    }
    /**
     * Return whether or not some text document currently has focus, and display an error message if not
     */
    validateTextDocumentHasFocus() {
        if (this._vscodeWrapper.activeTextEditorUri === undefined) {
            Utils.showErrorMsg(LocalizedConstants.noActiveEditorMsg);
            return false;
        }
        return true;
    }
    /**
     * Verifies the tools service version is high enough to support certain commands
     */
    canRunV2Command() {
        let version = serviceclient_1.default.instance.getServiceVersion();
        return version > 1;
    }
    showOnLaunchPrompts() {
        return __awaiter(this, void 0, void 0, function* () {
            // All prompts should be async and _not_ awaited so that we don't block the rest of the extension
            void this.showFirstLaunchPrompts();
        });
    }
    /**
     * Prompts the user to view release notes, if this is a new extension install
     */
    showFirstLaunchPrompts() {
        return __awaiter(this, void 0, void 0, function* () {
            let self = this;
            if (!this.doesExtensionLaunchedFileExist()) {
                // ask the user to view release notes document
                let confirmText = LocalizedConstants.viewMore;
                let promiseReleaseNotes = this._vscodeWrapper
                    .showInformationMessage(LocalizedConstants.releaseNotesPromptDescription, confirmText)
                    .then((result) => __awaiter(this, void 0, void 0, function* () {
                    if (result === confirmText) {
                        yield self.launchReleaseNotesPage();
                    }
                }));
                yield Promise.all([promiseReleaseNotes]);
            }
        });
    }
    /**
     * Shows the release notes page in the preview browser
     */
    launchReleaseNotesPage() {
        return __awaiter(this, void 0, void 0, function* () {
            yield vscode.env.openExternal(vscode.Uri.parse(Constants.changelogLink));
        });
    }
    /**
     * Shows the Getting Started page in the preview browser
     */
    launchGettingStartedPage() {
        return __awaiter(this, void 0, void 0, function* () {
            yield vscode.env.openExternal(vscode.Uri.parse(Constants.gettingStartedGuideLink));
        });
    }
    /**
     * Opens a new query and creates new connection
     */
    onNewQuery(node, content) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.canRunCommand()) {
                // from the object explorer context menu
                const editor = yield this._untitledSqlDocumentService.newQuery(content);
                const uri = editor.document.uri.toString(true);
                if (node) {
                    // connect to the node if the command came from the context
                    const connectionCreds = node.connectionInfo;
                    // if the node isn't connected
                    if (!node.sessionId) {
                        // connect it first
                        yield this.createObjectExplorerSession(connectionCreds);
                    }
                    this._statusview.languageFlavorChanged(uri, Constants.pgsqlProviderName);
                    yield this.connectionManager.connect(uri, connectionCreds);
                    // The token, expiry, or password may have been updated on the
                    // connection while the connection was being established.
                    this._objectExplorerProvider.updateConnectionCredentials(node.sessionId, node.connectionInfo);
                    this._statusview.sqlCmdModeChanged(uri, false);
                    yield this.connectionManager.connectionStore.removeRecentlyUsed(connectionCreds);
                    (0, telemetry_1.sendActionEvent)(telemetry_2.TelemetryViews.ObjectExplorer, telemetry_2.TelemetryActions.NewQuery, {
                        nodeType: node.nodeType,
                    }, undefined, node.connectionInfo, this._connectionMgr.getServerInfo(node.connectionInfo));
                    return true;
                }
                else {
                    // new query command
                    yield this.showConnectionsListandNewConnectionOption();
                    this._statusview.sqlCmdModeChanged(uri, false);
                    (0, telemetry_1.sendActionEvent)(telemetry_2.TelemetryViews.CommandPalette, telemetry_2.TelemetryActions.NewQuery, undefined, undefined);
                    return true;
                }
            }
            return false;
        });
    }
    onSchemaCompare(node) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.schemaCompareService.getDefaultOptions();
            const schemaCompareWebView = new schemaCompareWebViewController_1.SchemaCompareWebViewController(this._context, this._vscodeWrapper, node, this.schemaCompareService, this._connectionMgr, result, locConstants_1.SchemaCompare.Title);
            schemaCompareWebView.revealToForeground();
        });
    }
    /**
     * Check if the extension launched file exists.
     * This is to detect when we are running in a clean install scenario.
     */
    doesExtensionLaunchedFileExist() {
        // check if file already exists on disk
        let filePath = this._context.asAbsolutePath("extensionlaunched.dat");
        try {
            // this will throw if the file does not exist
            fs.statSync(filePath);
            return true;
        }
        catch (err) {
            try {
                // write out the "first launch" file if it doesn't exist
                fs.writeFile(filePath, "launched", (err) => {
                    return;
                });
            }
            catch (err) {
                // ignore errors writing first launch file since there isn't really
                // anything we can do to recover in this situation.
            }
            return false;
        }
    }
    /**
     * Called by VS Code when a text document closes. This will dispatch calls to other
     * controllers as needed. Determines if this was a normal closed file, a untitled closed file,
     * or a renamed file
     * @param doc The document that was closed
     */
    onDidCloseTextDocument(doc) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._connectionMgr === undefined || doc === undefined || doc.uri === undefined) {
                // Avoid processing events before initialization is complete
                return;
            }
            let closedDocumentUri = doc.uri.toString(true);
            let closedDocumentUriScheme = doc.uri.scheme;
            // Stop timers if they have been started
            if (this._lastSavedTimer) {
                this._lastSavedTimer.end();
            }
            // Determine which event caused this close event
            // If there was a saveTextDoc event just before this closeTextDoc event and it
            // was untitled then we know it was an untitled save
            if (this._lastSavedUri &&
                closedDocumentUriScheme === LocalizedConstants.untitledScheme &&
                this._lastSavedTimer.getDuration() < Constants.untitledSaveTimeThreshold) {
                // Untitled file was saved and connection will be transfered
                yield this._connectionMgr.transferFileConnection(closedDocumentUri, this._lastSavedUri);
                // If the untitled document was saved on close, then this
                // case will trigger without a followup to close the new
                // document with the saved name.
                // Start a timer to disconnect the new URI from the database
                // unless the URI appears in a document listed by onDidChangeVisibleTextEditors,
                // which indicates that this was a rename case rather than a save-on-close case.
                this._disconnectWithDelayUris.push(this._lastSavedUri);
                this.startDisconnectWithDelayTimer(Constants.closeDelay);
            }
            else {
                // This could be a close due to a rename.
                // Set a delay for the close to allow other events to prevent the disconnection.
                if (this._connectionMgr.isConnected(closedDocumentUri)) {
                    this._disconnectWithDelayUris.push(doc.uri.toString(true));
                    this.startDisconnectWithDelayTimer(Constants.closeDelay);
                }
            }
            // clean up: if a document is closed with actual plan enabled, remove it
            // from our status list
            if (this._queryResultWebviewController.actualPlanStatuses.includes(closedDocumentUri)) {
                this._queryResultWebviewController.actualPlanStatuses.filter((uri) => uri !== closedDocumentUri);
                vscode.commands.executeCommand("setContext", "pgsql.executionPlan.urisWithActualPlanEnabled", this._queryResultWebviewController.actualPlanStatuses);
            }
            // Reset special case timers and events
            this._lastSavedUri = undefined;
            this._lastSavedTimer = undefined;
            // Remove diagnostics for the related file
            let diagnostics = serviceclient_1.default.instance.diagnosticCollection;
            if (diagnostics.has(doc.uri)) {
                diagnostics.delete(doc.uri);
            }
            // Delete query result fiters for the closed uri
            singletonStore_1.default.delete(closedDocumentUri);
        });
    }
    /**
     * Called by VS Code when a text document is opened. Checks if a SQL file was opened
     * to enable features of our extension for the document.
     */
    onDidOpenTextDocument(doc) {
        if (this._connectionMgr === undefined) {
            // Avoid processing events before initialization is complete
            return;
        }
        this._connectionMgr.onDidOpenTextDocument(doc);
        if (doc && doc.languageId === Constants.languageId) {
            // set encoding to false
            this._statusview.languageFlavorChanged(doc.uri.toString(true), Constants.pgsqlProviderName);
        }
        // Setup properties incase of rename
        this._lastOpenedTimer = new Utils.Timer();
        this._lastOpenedTimer.start();
        if (doc && doc.uri) {
            this._lastOpenedUri = doc.uri.toString(true);
        }
    }
    /**
     * Called by VS Code when a text document is saved. Will trigger a timer to
     * help determine if the file was a file saved from an untitled file.
     * @param doc The document that was saved
     */
    onDidSaveTextDocument(doc) {
        if (this._connectionMgr === undefined) {
            // Avoid processing events before initialization is complete
            return;
        }
        // Set encoding to false by giving true as argument
        let savedDocumentUri = doc.uri.toString(true);
        // Keep track of which file was last saved and when for detecting the case when we save an untitled document to disk
        this._lastSavedTimer = new Utils.Timer();
        this._lastSavedTimer.start();
        this._lastSavedUri = savedDocumentUri;
    }
    onDidChangeVisibleTextEditors(params) {
        if (this._connectionMgr === undefined) {
            // Avoid processing events before initialization is complete
            return;
        }
        // Track the URIs of the editors that marked as visible
        // by this event. If a rename happens that is not a save-as
        // during a close, then we will see the new URI in this list
        // and avoid disconnecting it.
        this._recentlyVisibleUris = params.map((editor) => {
            var _a;
            return (_a = editor.document.uri) === null || _a === void 0 ? void 0 : _a.toString(true);
        });
    }
    onDidRenameFiles(params) {
        if (this._connectionMgr === undefined) {
            // Avoid processing events before initialization is complete
            return;
        }
        this._lastRenameEvent = params;
        this._lastRenameTimer = new Utils.Timer();
    }
    // Disconnect URIs that are marked after a delay
    // This allows us to setup a disconnect unless some other event
    // determines it should not happen.
    // For example, when an untitled file is saved when closing, where the connection
    // to the new URI should be disconnected unless it becomes visible
    // in the editor, detected by the onDidChangeVisibleTextEditors event.
    // Or a file rename happened in the file explorer, which will be detected
    // after the onDidCloseTextDocument event.
    startDisconnectWithDelayTimer(delay) {
        setTimeout(() => __awaiter(this, void 0, void 0, function* () {
            if (this._lastOpenedTimer) {
                this._lastOpenedTimer.end();
            }
            if (this._lastRenameTimer) {
                this._lastRenameTimer.end();
            }
            this._disconnectWithDelayUris.forEach((uri) => __awaiter(this, void 0, void 0, function* () {
                if (this._connectionMgr &&
                    this._connectionMgr.isConnected(uri) &&
                    !this._recentlyVisibleUris.includes(uri)) {
                    // Check if there was a rename.
                    let rename = undefined;
                    const renameTimerThreshold = delay + Constants.renamedOpenTimeThreshold;
                    // Handle the case where a file or a directory was renamed.
                    if (this._lastRenameTimer) {
                        if (this._lastRenameTimer.getDuration() < renameTimerThreshold) {
                            if (this._lastRenameEvent) {
                                this._lastRenameEvent.files.forEach((file) => {
                                    const oldUriString = file.oldUri.toString(true);
                                    const newUriString = file.newUri.toString(true);
                                    // Check if the URI matches or is contained within the renamed path.
                                    // If the rename was a directory, it will only emit one event, so
                                    // we need to calculate the new URI based on the old URI.
                                    if (uri.startsWith(oldUriString)) {
                                        rename = {
                                            oldUri: uri,
                                            newUri: uri.replace(oldUriString, newUriString),
                                        };
                                    }
                                });
                            }
                        }
                    }
                    if (rename === undefined &&
                        this._lastOpenedUri &&
                        this._lastOpenedTimer.getDuration() < renameTimerThreshold) {
                        // If there was an openTextDoc event just before this closeTextDoc event
                        // then we know it was a rename
                        rename = {
                            oldUri: uri,
                            newUri: this._lastOpenedUri,
                        };
                    }
                    if (rename) {
                        yield this._connectionMgr.transferFileConnection(rename.oldUri, rename.newUri);
                    }
                    else {
                        yield this._connectionMgr.onDidCloseTextDocument(uri);
                        this._outputContentProvider.onDidCloseTextDocument(uri);
                    }
                }
            }));
            // Reset
            this._disconnectWithDelayUris = [];
            this._lastOpenedTimer = undefined;
            this._lastOpenedUri = undefined;
            this._lastRenameTimer = undefined;
            this._lastRenameEvent = undefined;
        }), delay);
    }
    onChangeQueryHistoryConfig() {
        let queryHistoryFeatureEnabled = this._vscodeWrapper
            .getConfiguration(Constants.extensionConfigSectionName)
            .get(Constants.configEnableQueryHistoryFeature);
        if (queryHistoryFeatureEnabled) {
            this.initializeQueryHistory();
        }
    }
    /**
     * Called by VS Code when user settings are changed.
     * @param ConfigurationChangeEvent event that is fired when config is changed
     */
    onDidChangeConfiguration(e) {
        return __awaiter(this, void 0, void 0, function* () {
            if (e.affectsConfiguration(Constants.extensionName)) {
                // Query History settings change
                this.onChangeQueryHistoryConfig();
                // Connections change
                let needsRefresh = false;
                // user connections is a super set of object explorer connections
                // read the connections from global settings and workspace settings.
                let userConnections = yield this.connectionManager.connectionStore.connectionConfig.getConnections(true);
                let objectExplorerConnections = this._objectExplorerProvider.nodeConnections;
                // if a connection was manually removed
                let staleConnections = objectExplorerConnections.filter((oeConn) => {
                    return !userConnections.some((userConn) => Utils.isSameConnectionInfo(oeConn, userConn));
                });
                // disconnect those connections and then remove their credentials
                // from the credential store and MRU
                for (let conn of staleConnections) {
                    let profile = conn;
                    if (this.connectionManager.isActiveConnection(conn)) {
                        const uri = this.connectionManager.getUriForConnection(conn);
                        yield this.connectionManager.disconnect(uri);
                    }
                    yield this.connectionManager.connectionStore.removeRecentlyUsed(profile);
                    if (profile.authenticationType === Constants.sqlAuthentication &&
                        profile.savePassword) {
                        yield this.connectionManager.deleteCredential(profile);
                    }
                }
                // remove them from object explorer
                yield this._objectExplorerProvider.removeConnectionNodes(staleConnections);
                needsRefresh = staleConnections.length > 0;
                // if a connection(s) was/were manually added
                let newConnections = userConnections.filter((userConn) => {
                    return !objectExplorerConnections.some((oeConn) => Utils.isSameConnectionInfo(userConn, oeConn));
                });
                for (let conn of newConnections) {
                    // if a connection is not connected
                    // that means it was added manually
                    const newConnectionProfile = conn;
                    const uri = objectExplorerUtils_1.ObjectExplorerUtils.getNodeUriFromProfile(newConnectionProfile);
                    if (!this.connectionManager.isActiveConnection(conn) &&
                        !this.connectionManager.isConnecting(uri)) {
                        // add a disconnected node for the connection
                        this._objectExplorerProvider.addDisconnectedNode(conn);
                        needsRefresh = true;
                    }
                }
                yield this.sanitizeConnectionProfiles();
                if (needsRefresh) {
                    this._objectExplorerProvider.refresh(undefined);
                }
                if (e.affectsConfiguration(Constants.mssqlPiiLogging)) {
                    this.updatePiiLoggingLevel();
                }
                // Prompt to reload VS Code when any of these settings are updated.
                const configSettingsRequiringReload = [
                    Constants.configEnableExperimentalFeatures,
                    Constants.configChatEnable,
                ];
                if (configSettingsRequiringReload.some((setting) => e.affectsConfiguration(setting))) {
                    yield this.displayReloadMessage(LocalizedConstants.reloadPromptGeneric);
                }
            }
        });
    }
    /**
     * Updates Pii Logging configuration for Logger.
     */
    updatePiiLoggingLevel() {
        const piiLogging = vscode.workspace
            .getConfiguration(Constants.extensionName)
            .get(Constants.piiLogging, false);
        serviceclient_1.default.instance.logger.piiLogging = piiLogging;
    }
    /**
     * Display notification with button to reload
     * return true if button clicked
     * return false if button not clicked
     */
    displayReloadMessage(reloadPrompt) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield vscode.window.showInformationMessage(reloadPrompt, LocalizedConstants.reloadChoice);
            if (result === LocalizedConstants.reloadChoice) {
                yield vscode.commands.executeCommand("workbench.action.reloadWindow");
                return true;
            }
            else {
                return false;
            }
        });
    }
    removeAadAccount(prompter) {
        void this.connectionManager.removeAccount(prompter);
    }
    addAadAccount() {
        void this.connectionManager.addAccount();
    }
    onClearAzureTokenCache() {
        this.connectionManager.onClearTokenCache();
    }
    /**
     * Safely reveals a node in the Object Explorer tree with visibility check and error handling
     * @param node The node to reveal
     * @param options Reveal options
     * @returns Promise<void>
     */
    safeRevealInObjectExplorer(node, options) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                // Check if the Object Explorer tree is visible
                if (this.objectExplorerTree && this.objectExplorerTree.visible) {
                    yield this.objectExplorerTree.reveal(node, options);
                }
                else {
                    this._logger.log(`Object Explorer tree is not visible, skipping reveal for node: ${node.id || node.label}`);
                    return;
                }
            }
            catch (err) {
                this._logger.error(`Failed to reveal node in Object Explorer: ${(0, utils_1.getErrorMessage)(err)}. Node: ${node.id || node.label}`);
                // Log the error but don't throw it to avoid breaking the calling code
                (0, telemetry_1.sendErrorEvent)(telemetry_2.TelemetryViews.ObjectExplorer, telemetry_2.TelemetryActions.RevealNode, err, true, // includeErrorMessage
                undefined, // errorCode
                undefined, // errorType
                {
                    treeInitialized: (this.objectExplorerTree !== undefined).toString(),
                    treeVisible: (_a = this.objectExplorerTree) === null || _a === void 0 ? void 0 : _a.visible.toString(),
                });
                // Refreshing should reload all nodes to ensure the un-revealed node is visible
                this._objectExplorerProvider.refresh(undefined);
            }
        });
    }
}
exports.default = MainController;

//# sourceMappingURL=mainController.js.map
