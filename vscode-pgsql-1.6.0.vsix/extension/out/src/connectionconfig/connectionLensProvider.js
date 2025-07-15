"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectionLensProvider = void 0;
const vscode = require("vscode");
const ConnectionInfo = require("../models/connectionInfo");
const Constants = require("../constants/constants");
const LocConstants = require("../constants/locConstants");
class ConnectionLensProvider {
    constructor(context, _connectionManager) {
        this._connectionManager = _connectionManager;
        this._onDidChange = new vscode.EventEmitter();
        this.onDidChangeCodeLenses = this._onDidChange.event;
        // Refresh code lenses when connection state changes and ensure listeners are disposed
        context.subscriptions.push(this._connectionManager.onConnectionChanged(() => this._onDidChange.fire()));
        context.subscriptions.push(this._connectionManager.onConnectionComplete(() => this._onDidChange.fire()));
    }
    provideCodeLenses(document, _) {
        const serverRange = new vscode.Range(0, 0, 0, 0);
        const dbRange = new vscode.Range(1, 0, 0, 0);
        const uri = document.uri.toString(true);
        const isConnected = this._connectionManager.isConnected(uri);
        const isConnecting = this._connectionManager.isConnecting(uri);
        if (isConnected) {
            const connInfo = this._connectionManager.getConnectionInfo(uri);
            const db = connInfo.credentials.database || Constants.defaultDatabase;
            const server = connInfo.credentials.server;
            const port = connInfo.credentials.port;
            const serverDisplay = server + (port ? `:${port}` : "");
            return [
                new vscode.CodeLens(serverRange, {
                    title: serverDisplay,
                    tooltip: ConnectionInfo.getTooltip(connInfo.credentials, connInfo.serverInfo),
                    command: Constants.cmdConnect,
                }),
                new vscode.CodeLens(dbRange, {
                    title: db,
                    tooltip: LocConstants.changeDatabaseInstruction,
                    command: Constants.cmdChooseDatabase,
                }),
            ];
        }
        else if (isConnecting) {
            return [
                new vscode.CodeLens(serverRange, {
                    title: LocConstants.connectingLensLabel,
                    command: "",
                }),
            ];
        }
        return [
            new vscode.CodeLens(serverRange, {
                title: LocConstants.notConnectedLensLabel,
                command: Constants.cmdConnect,
                tooltip: LocConstants.notConnectedTooltip,
            }),
        ];
    }
}
exports.ConnectionLensProvider = ConnectionLensProvider;

//# sourceMappingURL=connectionLensProvider.js.map
