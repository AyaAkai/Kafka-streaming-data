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
exports.ConnectionDialogWebviewController = void 0;
const vscode = require("vscode");
const telemetry_1 = require("../sharedInterfaces/telemetry");
const connectionDialog_1 = require("../sharedInterfaces/connectionDialog");
const locConstants_1 = require("../constants/locConstants");
const azureHelpers_1 = require("./azureHelpers");
const telemetry_2 = require("../telemetry/telemetry");
const webview_1 = require("../sharedInterfaces/webview");
const userSurvey_1 = require("../nps/userSurvey");
const connectionConstants_1 = require("./connectionConstants");
const connectionInfo_1 = require("../models/connectionInfo");
const utils_1 = require("../utils/utils");
const vscode_1 = require("vscode");
const interfaces_1 = require("../models/interfaces");
const constants_1 = require("../constants/constants");
const formComponentHelpers_1 = require("./formComponentHelpers");
const Utils = require("../models/utils");
const formWebviewController_1 = require("../forms/formWebviewController");
const localhosts = ["localhost", "127.0.0.1"];
class ConnectionDialogWebviewController extends formWebviewController_1.FormWebviewController {
    //#endregion
    constructor(context, vscodeWrapper, _mainController, _objectExplorerProvider, _connectionToEdit, _serverGroupId) {
        var _a;
        super(context, vscodeWrapper, "connectionDialog", "connectionDialog", new connectionDialog_1.ConnectionDialogWebviewState(), {
            title: locConstants_1.ConnectionDialog.connectionDialog,
            viewColumn: vscode.ViewColumn.Active,
            iconPath: {
                dark: vscode.Uri.joinPath(context.extensionUri, "media", "connectionDialogEditor_dark.svg"),
                light: vscode.Uri.joinPath(context.extensionUri, "media", "connectionDialogEditor_light.svg"),
            },
        });
        this._mainController = _mainController;
        this._objectExplorerProvider = _objectExplorerProvider;
        this._connectionToEdit = _connectionToEdit;
        this._serverGroupId = _serverGroupId;
        this._isSslModeEdited = false;
        // Form may be initialized with a connection to edit, but it may not actually be
        // an existing saved connection. This may happen if the form was activated by a Uri Handler
        // connection, and is being offered a ConnectionInfo object parsed from those values.
        this._isEditingExisting = false;
        // If the connection to edit is passed in, if it doesn't have an id, we
        // can assume it is a non-saved connection.
        if ((_a = this._connectionToEdit) === null || _a === void 0 ? void 0 : _a.id) {
            this.logger.log(`Connection to edit passed in with id: ${this._connectionToEdit.id} and profile name: ${this._connectionToEdit.profileName}`);
            this._isEditingExisting = true;
            this.state.editingExistingConnection = true;
        }
        this.registerRpcHandlers();
        this.initializeDialog().catch((err) => {
            void vscode.window.showErrorMessage((0, utils_1.getErrorMessage)(err));
            // The spots in initializeDialog() that handle potential PII have their own error catches that emit error telemetry with `includeErrorMessage` set to false.
            // Everything else during initialization shouldn't have PII, so it's okay to include the error message here.
            (0, telemetry_2.sendErrorEvent)(telemetry_1.TelemetryViews.ConnectionDialog, telemetry_1.TelemetryActions.Initialize, err, true);
        });
    }
    initializeDialog() {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.log("Initializing connection dialog");
            try {
                yield this.updateLoadedConnections(this.state);
                this.updateState();
            }
            catch (err) {
                void vscode.window.showErrorMessage((0, utils_1.getErrorMessage)(err));
                (0, telemetry_2.sendErrorEvent)(telemetry_1.TelemetryViews.ConnectionDialog, telemetry_1.TelemetryActions.Initialize, err, false);
            }
            this.logger.log(`Has connection to edit: ${this._connectionToEdit !== undefined}`);
            try {
                if (this._connectionToEdit) {
                    yield this.loadConnectionToEdit();
                }
                else {
                    yield this.loadEmptyConnection();
                }
            }
            catch (err) {
                yield this.loadEmptyConnection();
                void vscode.window.showErrorMessage((0, utils_1.getErrorMessage)(err));
                (0, telemetry_2.sendErrorEvent)(telemetry_1.TelemetryViews.ConnectionDialog, telemetry_1.TelemetryActions.Initialize, err, false);
            }
            this.state.formComponents = yield (0, formComponentHelpers_1.generateConnectionComponents)(this._mainController.connectionManager, (0, azureHelpers_1.getAccounts)(this._mainController.azureAccountService), this.getAzureActionButtons());
            this.state.connectionComponents = {
                mainOptions: [...ConnectionDialogWebviewController.mainOptions],
                topAdvancedOptions: [
                    "port",
                    "applicationName",
                    "connectTimeout",
                    "multiSubnetFailover",
                ],
                groupedAdvancedOptions: [], // computed below
            };
            this.state.connectionComponents.groupedAdvancedOptions = (0, formComponentHelpers_1.groupAdvancedOptions)(this.state.formComponents, this.state.connectionComponents);
            yield this.updateItemVisibility();
            yield this.handleAzureMFAEdits("azureAuthType");
            yield this.handleAzureMFAEdits("accountId");
            yield this.handleAzureMFAEdits("tenantId");
            this.updateState();
        });
    }
    registerRpcHandlers() {
        this.registerReducer("setConnectionInputType", (state, payload) => __awaiter(this, void 0, void 0, function* () {
            this.state.selectedInputMode = payload.inputMode;
            yield this.updateItemVisibility();
            this.updateState();
            if (this.state.selectedInputMode === connectionDialog_1.ConnectionInputMode.AzureBrowse) {
                yield this.loadAllAzureServers(state);
            }
            return state;
        }));
        /**
         * Pre-populates the connection dialog with connection profile values
         * from a saved connection or a recent connection.
         */
        this.registerReducer("loadConnection", (state, payload) => __awaiter(this, void 0, void 0, function* () {
            (0, telemetry_2.sendActionEvent)(telemetry_1.TelemetryViews.ConnectionDialog, telemetry_1.TelemetryActions.LoadConnection);
            this.clearFormError();
            this.state.connectionProfile = payload.connection;
            // Overwrite certain fields that are unique to the instance of a
            // connection, and not the connection property itself
            this.state.connectionProfile.id = Utils.generateGuid();
            // If the group had been set directly (e.g. from the tree view), use
            // that groupId. Otherwise, keep the group from the loaded
            // connection.
            if (this._serverGroupId) {
                this.state.connectionProfile.groupId = this._serverGroupId;
            }
            this.state.selectedInputMode = connectionDialog_1.ConnectionInputMode.Parameters; // doesn't work: connectionString input mode isn't selected by default
            yield this.updateItemVisibility();
            yield this.handleAzureMFAEdits("azureAuthType");
            yield this.handleAzureMFAEdits("accountId");
            yield this.handleAzureMFAEdits("tenantId");
            return state;
        }));
        this.registerReducer("testconnect", (state) => __awaiter(this, void 0, void 0, function* () {
            return this.connectHelper(state, true);
        }));
        this.registerReducer("connect", (state) => __awaiter(this, void 0, void 0, function* () {
            return this.connectHelper(state);
        }));
        this.registerReducer("loadAzureServers", (state, payload) => __awaiter(this, void 0, void 0, function* () {
            yield this.loadAzureServersForSubscription(state, payload.subscriptionId);
            return state;
        }));
        this.registerReducer("fetchAzureDatabases", (state, payload) => __awaiter(this, void 0, void 0, function* () {
            yield this.fetchDatabasesForServer(state, payload.subscriptionId, payload.resourceGroup, payload.serverName);
            return state;
        }));
        this.registerReducer("addFirewallRule", (state, payload) => __awaiter(this, void 0, void 0, function* () {
            const [startIp, endIp] = typeof payload.ip === "string"
                ? [payload.ip, payload.ip]
                : [payload.ip.startIp, payload.ip.endIp];
            console.debug(`Setting firewall rule: "${payload.name}" (${startIp} - ${endIp})`);
            let account, tokenMappings;
            try {
                ({ account, tokenMappings } = yield this.constructAzureAccountForTenant(payload.tenantId));
            }
            catch (err) {
                state.formError = locConstants_1.ConnectionDialog.errorCreatingFirewallRule(`"${payload.name}" (${startIp} - ${endIp})`, (0, utils_1.getErrorMessage)(err));
                state.dialog = undefined;
                (0, telemetry_2.sendErrorEvent)(telemetry_1.TelemetryViews.ConnectionDialog, telemetry_1.TelemetryActions.AddFirewallRule, err, false, // includeErrorMessage
                undefined, // errorCode
                undefined, // errorType
                {
                    failure: "constructAzureAccountForTenant",
                });
                return state;
            }
            const result = yield this._mainController.connectionManager.firewallService.createFirewallRule({
                account: account,
                firewallRuleName: payload.name,
                startIpAddress: startIp,
                endIpAddress: endIp,
                serverName: this.state.connectionProfile.server,
                securityTokenMappings: tokenMappings,
            });
            if (!result.result) {
                state.formError = locConstants_1.ConnectionDialog.errorCreatingFirewallRule(`"${payload.name}" (${startIp} - ${endIp})`, result.errorMessage);
                (0, telemetry_2.sendErrorEvent)(telemetry_1.TelemetryViews.ConnectionDialog, telemetry_1.TelemetryActions.AddFirewallRule, new Error(result.errorMessage), false, // includeErrorMessage
                undefined, // errorCode
                undefined, // errorType
                {
                    failure: "firewallService.createFirewallRule",
                });
            }
            (0, telemetry_2.sendActionEvent)(telemetry_1.TelemetryViews.ConnectionDialog, telemetry_1.TelemetryActions.AddFirewallRule);
            state.dialog = undefined;
            this.updateState(state);
            return yield this.connectHelper(state);
        }));
        this.registerReducer("closeDialog", (state) => __awaiter(this, void 0, void 0, function* () {
            state.dialog = undefined;
            return state;
        }));
        this.registerReducer("filterAzureSubscriptions", (state) => __awaiter(this, void 0, void 0, function* () {
            yield (0, azureHelpers_1.promptForAzureSubscriptionFilter)(state);
            yield this.loadAllAzureServers(state);
            return state;
        }));
        this.registerReducer("refreshConnectionsList", (state) => __awaiter(this, void 0, void 0, function* () {
            yield this.updateLoadedConnections(state);
            return state;
        }));
        this.registerReducer("clearError", (state) => __awaiter(this, void 0, void 0, function* () {
            this.clearFormError();
            return state;
        }));
        this.registerReducer("deleteSavedConnection", (state, payload) => __awaiter(this, void 0, void 0, function* () {
            const confirm = yield vscode.window.showQuickPick([locConstants_1.Common.delete, locConstants_1.Common.cancel], {
                title: locConstants_1.Common.areYouSureYouWantTo(locConstants_1.ConnectionDialog.deleteTheSavedConnection(payload.connection.displayName)),
            });
            if (confirm !== locConstants_1.Common.delete) {
                return state;
            }
            const success = yield this._mainController.connectionManager.connectionStore.removeProfile(payload.connection);
            if (success) {
                yield this.updateLoadedConnections(state);
            }
            return state;
        }));
        this.registerReducer("removeRecentConnection", (state, payload) => __awaiter(this, void 0, void 0, function* () {
            yield this._mainController.connectionManager.connectionStore.removeRecentlyUsed(payload.connection);
            yield this.updateLoadedConnections(state);
            return state;
        }));
    }
    //#region Helpers
    handleFormAction(state, payload) {
        // Track if `sslmode` has been edited
        if (payload.event.propertyName === "sslmode") {
            this._isSslModeEdited = true;
        }
        // `sslmode` is set to "require" by default as a security practice,
        // but if it hasn't been edited and the server is set to localhost,
        // we want to set it to "prefer" to avoid SSL errors. We'll even
        // set it back to "require" if the server is changed to something else
        // and `sslmode` hasn't been edited.
        if (payload.event.propertyName === "server" && !this._isSslModeEdited) {
            this.state.formState["sslmode"] = localhosts.includes(String(payload.event.value))
                ? "prefer"
                : "require";
        }
        if (payload.event.propertyName === "authenticationType" &&
            payload.event.value !== connectionDialog_1.AuthenticationType.AzureMFA) {
            // If a token was generated previously, but we've switched to a different
            // authentication type, we need to clear the token so it doesn't indicate to PGTS
            // that we are using Azure MFA.
            this.state.connectionProfile.azureAccountToken = undefined;
        }
        return super.handleFormAction(state, payload);
    }
    //#region Connection helpers
    afterSetFormProperty(propertyName) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.handleAzureMFAEdits(propertyName);
        });
    }
    updateItemVisibility() {
        return __awaiter(this, void 0, void 0, function* () {
            let hiddenProperties = [];
            if (this.state.connectionProfile.authenticationType !== connectionDialog_1.AuthenticationType.SqlLogin) {
                hiddenProperties.push("user", "password", "savePassword");
            }
            if (this.state.connectionProfile.authenticationType !== connectionDialog_1.AuthenticationType.AzureMFA) {
                hiddenProperties.push("accountId", "entraUserName", "tenantId");
            }
            if (this.state.connectionProfile.authenticationType === connectionDialog_1.AuthenticationType.AzureMFA) {
                // Hide tenantId if accountId has only one tenant
                const tenants = yield (0, azureHelpers_1.getTenants)(this._mainController.azureAccountService, this.state.connectionProfile.accountId);
                if (tenants.length === 1) {
                    hiddenProperties.push("tenantId");
                }
            }
            for (const component of Object.values(this.state.formComponents)) {
                component.hidden = hiddenProperties.includes(component.propertyName);
            }
        });
    }
    getActiveFormComponents(state) {
        if (state.selectedInputMode === connectionDialog_1.ConnectionInputMode.Parameters ||
            state.selectedInputMode === connectionDialog_1.ConnectionInputMode.AzureBrowse) {
            return state.connectionComponents.mainOptions;
        }
        return ["connectionString", "profileName", "accountId"];
    }
    /** Cleans up a connection profile by clearing the properties that aren't being used
     * (e.g. due to form selections, like authType and inputMode) */
    cleanConnection(connection) {
        // Clear values for inputs that are hidden due to form selections
        for (const option of Object.values(this.state.formComponents)) {
            if (option.hidden) {
                connection[option.propertyName
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ] = undefined;
            }
        }
        return connection;
    }
    loadConnections() {
        return __awaiter(this, void 0, void 0, function* () {
            const unsortedConnections = yield this._mainController.connectionManager.connectionStore.readAllConnections(true /* includeRecentConnections */);
            const savedConnections = unsortedConnections.filter((c) => c.profileSource === interfaces_1.CredentialsQuickPickItemType.Profile);
            const recentConnections = unsortedConnections.filter((c) => c.profileSource === interfaces_1.CredentialsQuickPickItemType.Mru);
            (0, telemetry_2.sendActionEvent)(telemetry_1.TelemetryViews.ConnectionDialog, telemetry_1.TelemetryActions.LoadRecentConnections, undefined, // additionalProperties
            {
                savedConnectionsCount: savedConnections.length,
                recentConnectionsCount: recentConnections.length,
            });
            return {
                recentConnections: yield Promise.all(recentConnections
                    .map((conn) => {
                    try {
                        return this.initializeConnectionForDialog(conn);
                    }
                    catch (ex) {
                        console.error("Error initializing recent connection: " + (0, utils_1.getErrorMessage)(ex));
                        (0, telemetry_2.sendErrorEvent)(telemetry_1.TelemetryViews.ConnectionDialog, telemetry_1.TelemetryActions.LoadConnections, ex, false, // includeErrorMessage
                        undefined, // errorCode
                        undefined, // errorType
                        {
                            connectionType: "recent",
                            authType: conn.authenticationType,
                        });
                        return Promise.resolve(undefined);
                    }
                })
                    .filter((c) => c !== undefined)),
                savedConnections: yield Promise.all(savedConnections
                    .map((conn) => {
                    try {
                        return this.initializeConnectionForDialog(conn);
                    }
                    catch (ex) {
                        console.error("Error initializing saved connection: " + (0, utils_1.getErrorMessage)(ex));
                        (0, telemetry_2.sendErrorEvent)(telemetry_1.TelemetryViews.ConnectionDialog, telemetry_1.TelemetryActions.LoadConnections, ex, false, // includeErrorMessage
                        undefined, // errorCode
                        undefined, // errorType
                        {
                            connectionType: "saved",
                            authType: conn.authenticationType,
                        });
                        return Promise.resolve(undefined);
                    }
                })
                    .filter((c) => c !== undefined)),
            };
        });
    }
    updateLoadedConnections(state) {
        return __awaiter(this, void 0, void 0, function* () {
            const loadedConnections = yield this.loadConnections();
            state.recentConnections = loadedConnections.recentConnections;
            state.savedConnections = loadedConnections.savedConnections;
        });
    }
    validateProfile(connectionProfile) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!connectionProfile) {
                connectionProfile = this.state.connectionProfile;
            }
            // clean the connection by clearing the options that aren't being used
            const cleanedConnection = this.cleanConnection(connectionProfile);
            return yield this.validateForm(cleanedConnection);
        });
    }
    connectHelper(state_1) {
        return __awaiter(this, arguments, void 0, function* (state, testConnection = false) {
            this.state.connectionStatus = webview_1.ApiStatus.NotStarted;
            this.state.testConnectionStatus = webview_1.ApiStatus.NotStarted;
            const status = testConnection ? "testConnectionStatus" : "connectionStatus";
            const telemetryAction = testConnection
                ? telemetry_1.TelemetryActions.TestConnection
                : telemetry_1.TelemetryActions.CreateConnection;
            this.clearFormError();
            this.state[status] = webview_1.ApiStatus.Loading;
            this.updateState();
            const cleanedConnection = this.cleanConnection(this.state.connectionProfile);
            const erroredInputs = yield this.validateProfile(cleanedConnection);
            if (erroredInputs.length > 0) {
                this.state[status] = webview_1.ApiStatus.Error;
                console.warn("One more more inputs have errors: " + erroredInputs.join(", "));
                return state;
            }
            const otherConnections = (yield this._mainController.connectionManager.connectionStore.readAllConnections(false)).filter((conn) => conn.id !== cleanedConnection.id);
            const connNameMatch = otherConnections.find((conn) => {
                return conn.profileName === cleanedConnection.profileName;
            });
            if (connNameMatch) {
                this.state[status] = webview_1.ApiStatus.Error;
                this.state.formError = locConstants_1.ConnectionDialog.duplicateConnectionName(cleanedConnection.profileName);
                this.updateState();
                return state;
            }
            if (!testConnection) {
                if (yield this.hasDuplicateConnectionDetails(cleanedConnection)) {
                    return state;
                }
                // After creation, we no longer want to maintain the connection string in the profile
                cleanedConnection.connectionString = undefined;
            }
            const newOrEdited = this._connectionToEdit ? "edited" : "new";
            try {
                const result = yield this._mainController.connectionManager.connectionUI.validateAndSaveProfileFromDialog(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                cleanedConnection);
                if (result.errorMessage) {
                    this.state[status] = webview_1.ApiStatus.Error;
                    return yield this.handleConnectionErrorCodes(result, state);
                }
            }
            catch (error) {
                this.state.formError = (0, utils_1.getErrorMessage)(error);
                this.state[status] = webview_1.ApiStatus.Error;
                (0, telemetry_2.sendErrorEvent)(telemetry_1.TelemetryViews.ConnectionDialog, telemetryAction, error, false, // includeErrorMessage
                undefined, // errorCode
                undefined, // errorType
                {
                    connectionInputType: this.state.selectedInputMode,
                    authMode: this.state.connectionProfile.authenticationType,
                    newOrEditedConnection: newOrEdited,
                });
                return state;
            }
            (0, telemetry_2.sendActionEvent)(telemetry_1.TelemetryViews.ConnectionDialog, telemetryAction, {
                result: "success",
                newOrEditedConnection: newOrEdited,
                connectionInputType: this.state.selectedInputMode,
                authMode: this.state.connectionProfile.authenticationType,
                provider: Utils.detectPostgresProvider(this.state.connectionProfile.server),
            });
            if (!testConnection) {
                try {
                    if (this._connectionToEditCopy) {
                        yield this.removeConnectionAndRefresh(this._connectionToEditCopy);
                    }
                    yield this.saveConnectionAndStartObjectExplorerSession(state);
                }
                catch (error) {
                    this.logger.error("Could not save connection and start object explorer session", error === null || error === void 0 ? void 0 : error.message);
                    this.state.formError = locConstants_1.ConnectionDialog.errorAddingConnection;
                    this.state.connectionStatus = webview_1.ApiStatus.Error;
                    (0, telemetry_2.sendErrorEvent)(telemetry_1.TelemetryViews.ConnectionDialog, telemetryAction, error, false, // includeErrorMessage
                    undefined, // errorCode
                    undefined, // errorType
                    {
                        connectionInputType: this.state.selectedInputMode,
                        authMode: this.state.connectionProfile.authenticationType,
                    });
                }
            }
            else {
                this.state.testConnectionStatus = webview_1.ApiStatus.Loaded;
            }
            return state;
        });
    }
    saveConnectionAndStartObjectExplorerSession(state) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._mainController.connectionManager.connectionUI.saveProfile(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            this.state.connectionProfile);
            const node = yield this._mainController.createObjectExplorerSessionFromDialog(this.state.connectionProfile);
            this._objectExplorerProvider.refresh(undefined);
            yield this.updateLoadedConnections(state);
            this.updateState();
            this.state.connectionStatus = webview_1.ApiStatus.Loaded;
            yield this._mainController.safeRevealInObjectExplorer(node, {
                focus: true,
                select: true,
                expand: true,
            });
            yield this.panel.dispose();
            userSurvey_1.UserSurvey.getInstance().promptUserForNPSFeedback();
        });
    }
    removeConnectionAndRefresh(connection) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._objectExplorerProvider.removeConnectionNodes([connection]);
            yield this._mainController.connectionManager.connectionStore.removeProfile(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            connection);
            this._objectExplorerProvider.refresh(undefined);
        });
    }
    /**
    * Check if the unique elements of the connection would create a duplicate
    * profile entry. This is currently unsuported by PG Tools Service.
    *
    * TODO-PG: This could be removed if connection profile {id} is added to the node URI
    * which is now available in the profiles

    * @param cleanedConnection The cleaned connection object to check for duplicates against
    */
    hasDuplicateConnectionDetails(cleanedConnection) {
        return __awaiter(this, void 0, void 0, function* () {
            const savedProfiles = yield this._mainController.connectionManager.connectionStore.readAllConnections();
            this.logger.log(`Checking for duplicates against ${savedProfiles.length} profiles`);
            let duplicateProfileLabel = "";
            let isDuplicate = false;
            for (const profile of savedProfiles) {
                const isEditingSameProfile = this._connectionToEdit
                    ? Utils.isSameConnectionInfo(profile, this._connectionToEdit)
                    : false;
                // Editing the exact same profile is not considered a duplicate
                if (isEditingSameProfile && this._isEditingExisting) {
                    this.logger.log(`Editing the same profile, not a duplicate ${profile.profileName}`);
                    continue;
                }
                const hasSameConnProps = Utils.isSameConnectionInfo(cleanedConnection, profile, false);
                this.logger.log(`Has same connection props: ${hasSameConnProps}: ${profile.profileName}`);
                if (hasSameConnProps) {
                    duplicateProfileLabel = profile.profileName;
                    isDuplicate = true;
                    break;
                }
            }
            if (isDuplicate) {
                this.state.formError = locConstants_1.ConnectionDialog.duplicateConnectionSpec(duplicateProfileLabel);
                this.state.connectionStatus = webview_1.ApiStatus.Error;
                this.logger.log(`Duplicate connection profile detected during creation. Existing profile label was: ${duplicateProfileLabel}`);
            }
            return isDuplicate;
        });
    }
    handleConnectionErrorCodes(result, state) {
        return __awaiter(this, void 0, void 0, function* () {
            if (result.errorNumber === connectionConstants_1.connectionCertValidationFailedErrorCode) {
                this.state.dialog = {
                    type: "trustServerCert",
                    message: result.errorMessage,
                };
                // connection failing because the user didn't trust the server cert is not an error worth logging;
                // just prompt the user to trust the cert
                return state;
            }
            else if (result.errorNumber === connectionConstants_1.connectionFirewallErrorCode) {
                const handleFirewallErrorResult = yield this._mainController.connectionManager.firewallService.handleFirewallRule(result.errorNumber, result.errorMessage);
                if (!handleFirewallErrorResult.result) {
                    (0, telemetry_2.sendErrorEvent)(telemetry_1.TelemetryViews.ConnectionDialog, telemetry_1.TelemetryActions.AddFirewallRule, new Error(result.errorMessage), true, // includeErrorMessage; parse failed because it couldn't detect an IP address, so that'd be the only PII
                    undefined, // errorCode
                    undefined);
                    // Proceed with 0.0.0.0 as the client IP, and let user fill it out manually.
                    handleFirewallErrorResult.ipAddress = "0.0.0.0";
                }
                const auth = yield (0, azureHelpers_1.confirmVscodeAzureSignin)();
                const tenants = yield auth.getTenants();
                this.state.dialog = {
                    type: "addFirewallRule",
                    message: result.errorMessage,
                    clientIp: handleFirewallErrorResult.ipAddress,
                    tenants: tenants.map((t) => {
                        return {
                            name: t.displayName,
                            id: t.tenantId,
                        };
                    }),
                };
                return state;
            }
            this.state.formError = result.errorMessage;
            (0, telemetry_2.sendActionEvent)(telemetry_1.TelemetryViews.ConnectionDialog, telemetry_1.TelemetryActions.CreateConnection, {
                result: "connectionError",
                errorNumber: String(result.errorNumber),
                newOrEditedConnection: this._connectionToEditCopy ? "edited" : "new",
                connectionInputType: this.state.selectedInputMode,
                authMode: this.state.connectionProfile.authenticationType,
                provider: Utils.detectPostgresProvider(this.state.connectionProfile.server),
            });
            return state;
        });
    }
    loadConnectionToEdit() {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.log("Loading connection to edit");
            if (this._connectionToEdit) {
                this._connectionToEditCopy = structuredClone(this._connectionToEdit);
                // Merge the default connection attributes with this connection to
                // ensure appropriate defaults are set.
                const defaultValues = yield this.getDefaultProperties(this._connectionToEdit.server);
                this._connectionToEdit = Object.assign(Object.assign({}, defaultValues), this._connectionToEdit);
                const connection = yield this.initializeConnectionForDialog(this._connectionToEdit);
                this.state.connectionProfile = connection;
                // We open an existing connection as paramters mode regardless of creation method
                // TODO-PG enhancement: if we want to preserve original mode,
                // we need to store connection string or Azure dropdown selections
                this.state.selectedInputMode = connectionDialog_1.ConnectionInputMode.Parameters;
                this.updateState();
            }
        });
    }
    loadEmptyConnection() {
        return __awaiter(this, void 0, void 0, function* () {
            const emptyConnection = yield this.getDefaultProperties();
            this.state.connectionProfile = emptyConnection;
        });
    }
    /**
     * Get the default elements of a connection profile when creating or editing a connection.
     * For editing scenarios, these values should not supersede any existing values.
     * @param server If provided, determines the sslmode. localhost-equivalents will be set to "prefer", otherwise "require"
     */
    getDefaultProperties(server) {
        return __awaiter(this, void 0, void 0, function* () {
            const groupId = this._serverGroupId || (yield (0, formComponentHelpers_1.getDefaultServerGroupValue)());
            return {
                id: Utils.generateGuid(),
                groupId: groupId,
                authenticationType: connectionDialog_1.AuthenticationType.SqlLogin,
                connectTimeout: 15,
                applicationName: constants_1.connectionApplicationName,
                clientEncoding: constants_1.defaultClientEncoding,
                sslmode: localhosts.includes(server) ? "prefer" : "require",
            };
        });
    }
    initializeConnectionForDialog(connection) {
        return __awaiter(this, void 0, void 0, function* () {
            // Load the password if it's saved
            const password = yield this._mainController.connectionManager.connectionStore.lookupPassword(connection);
            connection.password = password;
            connection.connectionString = undefined;
            const dialogConnection = connection;
            // Set the display name
            dialogConnection.displayName = dialogConnection.profileName
                ? dialogConnection.profileName
                : (0, connectionInfo_1.getConnectionDisplayName)(connection);
            return dialogConnection;
        });
    }
    //#endregion
    //#region Azure helpers
    getAzureActionButtons() {
        return __awaiter(this, void 0, void 0, function* () {
            const actionButtons = [];
            actionButtons.push({
                label: locConstants_1.ConnectionDialog.signIn,
                id: "azureSignIn",
                callback: () => __awaiter(this, void 0, void 0, function* () {
                    const account = yield this._mainController.azureAccountService.addAccount();
                    const accountsComponent = this.getFormComponent(this.state, "accountId");
                    if (accountsComponent) {
                        accountsComponent.options = yield (0, azureHelpers_1.getAccounts)(this._mainController.azureAccountService);
                        this.state.connectionProfile.accountId = account.key.id;
                        this.updateState();
                        yield this.handleAzureMFAEdits("accountId");
                    }
                }),
            });
            // Note for upstream merges: see history for previous behavior.
            // This method would acquire a new token for the account, check for
            // expiration, and return an additional "refresh token" button in that case.
            // However, the token would always be generated fresh, so the refresh
            // button was never shown. The token acquisition sometimes took 10+ seconds
            // and it was called when the authType is changed, making it appear broken.
            // The token was not otherwise used or stored within this method (e.g., it
            // was not used for the connection)
            return actionButtons;
        });
    }
    /*
     * Populates the entraUserName field with the email of the selected account
     * if the accountId is set and the entraUserName field is not already populated.
     * This is used to pre-populate the entraUserName field when the user selects an
     * Azure account in the connection dialog, but can be overwritten.
     *
     * Don't adjust the value if it's already been set.
     */
    populateEntraUserName(entraNameComponent) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const hasEmptyEntraUserName = !this.state.connectionProfile.entraUserName && this.state.connectionProfile.accountId;
            if (entraNameComponent && hasEmptyEntraUserName) {
                try {
                    const accounts = yield this._mainController.azureAccountService.getAccounts();
                    const selectedAccount = accounts.find((account) => { var _a; return ((_a = account.displayInfo) === null || _a === void 0 ? void 0 : _a.userId) === this.state.connectionProfile.accountId; });
                    if ((_a = selectedAccount === null || selectedAccount === void 0 ? void 0 : selectedAccount.displayInfo) === null || _a === void 0 ? void 0 : _a.email) {
                        this.state.connectionProfile.entraUserName = selectedAccount.displayInfo.email;
                    }
                    else {
                        this.logger.log(`No email found for account ${this.state.connectionProfile.accountId}, can't pre-populate entraUserName`);
                    }
                }
                catch (err) {
                    this.logger.error(`Error fetching accounts for accountId ${this.state.connectionProfile.accountId}, can't pre-populate entraUserName`, err);
                }
            }
        });
    }
    handleAzureMFAEdits(propertyName) {
        return __awaiter(this, void 0, void 0, function* () {
            const mfaComponents = [
                "accountId",
                "entraUserName",
                "tenantId",
                "authenticationType",
            ];
            if (mfaComponents.includes(propertyName)) {
                if (this.state.connectionProfile.authenticationType !== connectionDialog_1.AuthenticationType.AzureMFA) {
                    return;
                }
                const accountComponent = this.getFormComponent(this.state, "accountId");
                const entranameComponent = this.getFormComponent(this.state, "entraUserName");
                const tenantComponent = this.getFormComponent(this.state, "tenantId");
                let tenants = [];
                switch (propertyName) {
                    case "accountId":
                        tenants = yield (0, azureHelpers_1.getTenants)(this._mainController.azureAccountService, this.state.connectionProfile.accountId);
                        if (tenantComponent) {
                            tenantComponent.options = tenants;
                            if (tenants && tenants.length > 0) {
                                // Select a default tenant if no tenant is currently selected,
                                // or if the current tenant is not valid for this account
                                const currentTenantId = this.state.connectionProfile.tenantId;
                                const currentTenantExists = tenants.some((tenant) => tenant.value === currentTenantId);
                                if (!currentTenantId || !currentTenantExists) {
                                    this.state.connectionProfile.tenantId = tenants[0].value;
                                }
                            }
                        }
                        yield this.populateEntraUserName(entranameComponent);
                        accountComponent.actionButtons = yield this.getAzureActionButtons();
                        break;
                    case "tenantId":
                        break;
                    case "entraUserName":
                        break;
                    case "authenticationType":
                        const firstOption = accountComponent.options[0];
                        if (firstOption) {
                            this.state.connectionProfile.accountId = firstOption.value;
                        }
                        tenants = yield (0, azureHelpers_1.getTenants)(this._mainController.azureAccountService, this.state.connectionProfile.accountId);
                        if (tenantComponent) {
                            tenantComponent.options = tenants;
                            if (tenants && tenants.length > 0) {
                                this.state.connectionProfile.tenantId = tenants[0].value;
                            }
                        }
                        yield this.populateEntraUserName(entranameComponent);
                        accountComponent.actionButtons = yield this.getAzureActionButtons();
                        break;
                }
            }
        });
    }
    constructAzureAccountForTenant(tenantId) {
        return __awaiter(this, void 0, void 0, function* () {
            const auth = yield (0, azureHelpers_1.confirmVscodeAzureSignin)();
            const subs = yield auth.getSubscriptions(false /* filter */);
            const sub = subs.filter((s) => s.tenantId === tenantId)[0];
            if (!sub) {
                throw new Error(locConstants_1.ConnectionDialog.errorLoadingAzureAccountInfoForTenantId(tenantId));
            }
            const token = yield sub.credential.getToken(".default");
            const session = yield sub.authentication.getSession();
            const account = {
                displayInfo: {
                    displayName: session.account.label,
                    userId: session.account.label,
                    name: session.account.label,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    accountType: session.account.type,
                },
                key: {
                    providerId: "microsoft",
                    id: session.account.label,
                },
                isStale: false,
                properties: {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    azureAuthType: 0,
                    providerSettings: undefined,
                    isMsAccount: false,
                    owningTenant: undefined,
                    tenants: [
                        {
                            displayName: sub.tenantId,
                            id: sub.tenantId,
                            userId: token.token,
                        },
                    ],
                },
            };
            const tokenMappings = {};
            tokenMappings[sub.tenantId] = {
                Token: token.token,
            };
            return { account, tokenMappings };
        });
    }
    loadAzureSubscriptions(state) {
        return __awaiter(this, void 0, void 0, function* () {
            let endActivity;
            try {
                const auth = yield (0, azureHelpers_1.confirmVscodeAzureSignin)();
                if (!auth) {
                    state.formError = vscode_1.l10n.t("Azure sign in failed.");
                    return undefined;
                }
                state.loadingAzureSubscriptionsStatus = webview_1.ApiStatus.Loading;
                this.updateState();
                // getSubscriptions() below checks this config setting if filtering is specified.  If the user has this set, then we use it; if not, we get all subscriptions.
                // The specific vscode config setting it uses is hardcoded into the VS Code Azure SDK, so we need to use the same value here.
                const shouldUseFilter = vscode.workspace
                    .getConfiguration()
                    .get(azureHelpers_1.azureSubscriptionFilterConfigKey) !== undefined;
                endActivity = (0, telemetry_2.startActivity)(telemetry_1.TelemetryViews.ConnectionDialog, telemetry_1.TelemetryActions.LoadAzureSubscriptions);
                this._azureSubscriptions = new Map((yield auth.getSubscriptions(shouldUseFilter)).map((s) => [s.subscriptionId, s]));
                const tenantSubMap = this.groupBy(Array.from(this._azureSubscriptions.values()), "tenantId"); // TODO: replace with Object.groupBy once ES2024 is supported
                const subs = [];
                for (const t of tenantSubMap.keys()) {
                    for (const s of tenantSubMap.get(t)) {
                        subs.push({
                            id: s.subscriptionId,
                            name: s.name,
                            loaded: false,
                        });
                    }
                }
                state.azureSubscriptions = subs;
                state.loadingAzureSubscriptionsStatus = webview_1.ApiStatus.Loaded;
                endActivity.end(telemetry_1.ActivityStatus.Succeeded, undefined, // additionalProperties
                {
                    subscriptionCount: subs.length,
                });
                this.updateState();
                return tenantSubMap;
            }
            catch (error) {
                state.formError = vscode_1.l10n.t("Error loading Azure subscriptions.");
                state.loadingAzureSubscriptionsStatus = webview_1.ApiStatus.Error;
                console.error(state.formError + "\n" + (0, utils_1.getErrorMessage)(error));
                endActivity.endFailed(error, false);
                return undefined;
            }
        });
    }
    loadAllAzureServers(state) {
        return __awaiter(this, void 0, void 0, function* () {
            const endActivity = (0, telemetry_2.startActivity)(telemetry_1.TelemetryViews.ConnectionDialog, telemetry_1.TelemetryActions.LoadAzureServers);
            try {
                const tenantSubMap = yield this.loadAzureSubscriptions(state);
                if (!tenantSubMap) {
                    return;
                }
                if (tenantSubMap.size === 0) {
                    state.formError = vscode_1.l10n.t("No subscriptions available.  Adjust your subscription filters to try again.");
                }
                else {
                    state.loadingAzureServersStatus = webview_1.ApiStatus.Loading;
                    state.azureServers = [];
                    this.updateState();
                    const promiseArray = [];
                    for (const t of tenantSubMap.keys()) {
                        for (const s of tenantSubMap.get(t)) {
                            promiseArray.push(this.loadAzureServersForSubscription(state, s.subscriptionId));
                        }
                    }
                    yield Promise.all(promiseArray);
                    endActivity.end(telemetry_1.ActivityStatus.Succeeded, undefined, // additionalProperties
                    {
                        subscriptionCount: promiseArray.length,
                    });
                    state.loadingAzureServersStatus = webview_1.ApiStatus.Loaded;
                    return;
                }
            }
            catch (error) {
                state.formError = vscode_1.l10n.t("Error loading Azure databases.");
                state.loadingAzureServersStatus = webview_1.ApiStatus.Error;
                console.error(state.formError + "\n" + (0, utils_1.getErrorMessage)(error));
                endActivity.endFailed(error, false);
                return;
            }
        });
    }
    loadAzureServersForSubscription(state, subscriptionId) {
        return __awaiter(this, void 0, void 0, function* () {
            const azSub = this._azureSubscriptions.get(subscriptionId);
            const stateSub = state.azureSubscriptions.find((s) => s.id === subscriptionId);
            try {
                const servers = yield (0, azureHelpers_1.fetchServersFromAzure)(azSub);
                state.azureServers.push(...servers);
                stateSub.loaded = true;
                this.updateState();
                console.log(`Loaded ${servers.length} servers for subscription ${azSub.name} (${azSub.subscriptionId})`);
            }
            catch (error) {
                console.error(locConstants_1.ConnectionDialog.errorLoadingAzureDatabases(azSub.name, azSub.subscriptionId), +"\n" + (0, utils_1.getErrorMessage)(error));
                (0, telemetry_2.sendErrorEvent)(telemetry_1.TelemetryViews.ConnectionDialog, telemetry_1.TelemetryActions.LoadAzureServers, error, true, // includeErrorMessage
                undefined, // errorCode
                undefined);
            }
        });
    }
    fetchDatabasesForServer(state, subscriptionId, resourceGroup, serverName) {
        return __awaiter(this, void 0, void 0, function* () {
            const azSub = this._azureSubscriptions.get(subscriptionId);
            try {
                const databases = yield (0, azureHelpers_1.fetchDatabasesForServerFromAzure)(azSub, resourceGroup, serverName);
                state.serverToDatabaseMap[serverName] = databases;
                state.fetchingAzureDatabasesStatus = webview_1.ApiStatus.Loaded;
                this.updateState();
            }
            catch (error) {
                state.formError = locConstants_1.ConnectionDialog.errorLoadingAzureDatabasesForServer(azSub.name, azSub.subscriptionId, serverName);
                state.fetchingAzureDatabasesStatus = webview_1.ApiStatus.Error;
                console.error(state.formError + "\n" + (0, utils_1.getErrorMessage)(error));
                (0, telemetry_2.sendErrorEvent)(telemetry_1.TelemetryViews.ConnectionDialog, telemetry_1.TelemetryActions.fetchAzureDatabases, error, true, // includeErrorMessage
                undefined, // errorCode
                undefined);
            }
        });
    }
    //#endregion
    //#region Miscellanous helpers
    clearFormError() {
        this.state.formError = "";
        for (const component of this.getActiveFormComponents(this.state).map((x) => this.state.formComponents[x])) {
            component.validation = undefined;
        }
    }
    groupBy(values, key) {
        return values.reduce((rv, x) => {
            const keyValue = x[key];
            if (!rv.has(keyValue)) {
                rv.set(keyValue, []);
            }
            rv.get(keyValue).push(x);
            return rv;
        }, new Map());
    }
}
exports.ConnectionDialogWebviewController = ConnectionDialogWebviewController;
//#region Properties
ConnectionDialogWebviewController.mainOptions = [
    "server",
    "authenticationType",
    "user",
    "password",
    "savePassword",
    "accountId",
    "entraUserName",
    "tenantId",
    "azureAccountToken",
    "database",
    "profileName",
    "groupId",
];

//# sourceMappingURL=connectionDialogWebviewController.js.map
