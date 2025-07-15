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
exports.SchemaDesignerService = void 0;
const vscode = require("vscode");
const schemaDesigner_1 = require("../models/contracts/schemaDesigner");
const schemaDesignerWebviewController_1 = require("../schemaDesigner/schemaDesignerWebviewController");
const Constants = require("../constants/constants");
const utils_1 = require("../utils/utils");
const telemetry_1 = require("../sharedInterfaces/telemetry");
const telemetry_2 = require("../telemetry/telemetry");
class SchemaDesignerService {
    // TODO: LOGGER!
    constructor(_context, _vscodeWrapper, _sqlToolsClient, _connectionManager) {
        this._context = _context;
        this._vscodeWrapper = _vscodeWrapper;
        this._sqlToolsClient = _sqlToolsClient;
        this._connectionManager = _connectionManager;
        this._sessionsMap = new Map();
        this._connIdMap = new Map();
    }
    registerCommands() {
        /* Register the VSCode command triggers */
        this._context.subscriptions.push(vscode.commands.registerCommand(Constants.cmdVisualizeSchema, (node) => __awaiter(this, void 0, void 0, function* () { return this.createSchemaWebviewSessionFromTreeNode(node); })));
        /* Register notifications with the language client service */
        this._sqlToolsClient.onNotification(schemaDesigner_1.CreateSessionCompleteNotification.type, this.handleSessionCreatedNotification());
        this._sqlToolsClient.onNotification(schemaDesigner_1.GetSchemaModelComplete.type, this.handleGetSchemaModelCompleteNotification());
        this._sqlToolsClient.onNotification(schemaDesigner_1.TriggerSchemaRefresh.type, this.handleTriggerSchemaRefreshNotifications());
    }
    // #region Initialization & Session Control
    createSchemaWebviewSessionFromTreeNode(node) {
        return __awaiter(this, void 0, void 0, function* () {
            const connInfo = Object.assign({}, node.connectionInfo, {
                database: node.metadata.name,
            });
            return this.createSchemaWebviewSession(connInfo);
        });
    }
    createSchemaWebviewSession(connectionInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            const uri = this.generateSessionUri(connectionInfo);
            // If we have an existing session, reveal it instead of recreating
            const existingSession = this._sessionsMap.get(uri);
            if (existingSession) {
                yield existingSession.triggerRefresh();
                existingSession.revealToForeground();
                return;
            }
            (0, telemetry_2.sendActionEvent)(telemetry_1.TelemetryViews.SchemaDesigner, telemetry_1.TelemetryActions.Initialize);
            const schemaDesignerWebview = new schemaDesignerWebviewController_1.SchemaDesignerWebviewController(this._context, this._vscodeWrapper, this, uri, `${connectionInfo.profileName}: ${connectionInfo.database}`);
            schemaDesignerWebview.onDisposed(() => {
                this._sessionsMap.delete(uri);
                this.closeSession({
                    sessionId: uri,
                }).catch(() => { });
            });
            schemaDesignerWebview.revealToForeground();
            this._sessionsMap.set(uri, schemaDesignerWebview);
            void this.createConnection(uri, connectionInfo);
        });
    }
    createConnection(sessionId, connInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            const connected = yield this._connectionManager.connect(sessionId, connInfo);
            this._connIdMap.set(this._connectionManager.getConnectionInfo(sessionId).connectionId, sessionId);
            // Though unlikely, it is theoretically possible for a race condition
            // User closes the view immediately; before the connection is completed
            const session = this._sessionsMap.get(sessionId);
            if (!session && connected) {
                void this._connectionManager.disconnect(sessionId);
                return;
            }
            if (!connected) {
                void session.handleSessionCreatedNotification(false);
                return;
            }
            void this.createSession({ sessionId: sessionId });
        });
    }
    closeConnection() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    createSession(request) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this._sqlToolsClient.sendRequest(schemaDesigner_1.CreateSessionRequest.type, request);
            }
            catch (e) {
                this._sqlToolsClient.logger.error(e);
                (0, telemetry_2.sendErrorEvent)(telemetry_1.TelemetryViews.SchemaDesigner, telemetry_1.TelemetryActions.SchemaDesignerCreateSession, e);
                throw e;
            }
        });
    }
    closeSession(request) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this._sqlToolsClient.sendRequest(schemaDesigner_1.CloseSessionRequest.type, request);
            }
            catch (e) {
                this._sqlToolsClient.logger.error(e);
                (0, telemetry_2.sendErrorEvent)(telemetry_1.TelemetryViews.SchemaDesigner, telemetry_1.TelemetryActions.SchemaDesignerCloseSession, e);
                throw e;
            }
            finally {
                void this._connectionManager.disconnect(request.sessionId);
            }
        });
    }
    // #endregion
    // #region Webview interaction callbacks
    getSchemaModel(request) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this._sqlToolsClient.sendRequest(schemaDesigner_1.GetSchemaModelRequest.type, request);
            }
            catch (e) {
                this._sqlToolsClient.logger.error(e);
                (0, telemetry_2.sendErrorEvent)(telemetry_1.TelemetryViews.SchemaDesigner, telemetry_1.TelemetryActions.SchemaDesignerGetSchemaModel, e);
                throw e;
            }
        });
    }
    // #endregion
    // #region Language Server notification handlers
    handleSessionCreatedNotification() {
        const self = this;
        const handler = (notif) => __awaiter(this, void 0, void 0, function* () {
            const session = self._sessionsMap.get(notif.sessionId);
            if (!session) {
                void self.closeSession(notif);
                return;
            }
            yield session.handleSessionCreatedNotification(true);
        });
        return handler;
    }
    handleGetSchemaModelCompleteNotification() {
        const self = this;
        const handler = (notif) => {
            const session = self._sessionsMap.get(notif.sessionId);
            if (!session) {
                void self.closeSession(notif);
                return;
            }
            session.handleGetSchemaModel({ tables: notif.tables });
        };
        return handler;
    }
    handleTriggerSchemaRefreshNotifications() {
        const self = this;
        const handler = (notif) => __awaiter(this, void 0, void 0, function* () {
            let sessionId = "";
            if (notif.connectionId) {
                sessionId = this._connIdMap.get(notif.connectionId);
            }
            else {
                sessionId = notif.sessionId;
            }
            const session = self._sessionsMap.get(sessionId);
            if (!session && sessionId) {
                void self.closeSession({ sessionId: sessionId });
                return;
            }
            if (sessionId) {
                yield session.triggerRefresh();
            }
        });
        return handler;
    }
    // #endregion
    // #region Utility functions
    generateSessionUri(connInfo) {
        const host = (0, utils_1.encodeRFC3986)(connInfo.server);
        const user = (0, utils_1.encodeRFC3986)(connInfo.user);
        const db = (0, utils_1.encodeRFC3986)(connInfo.database);
        const port_str = connInfo.port
            ? "" + connInfo.port
            : Constants.DockerConstants.dockerDefaultDbPort;
        return `schemadesigner://${user}@${host}:${port_str}:${db}/`;
    }
}
exports.SchemaDesignerService = SchemaDesignerService;

//# sourceMappingURL=schemaDesignerService.js.map
