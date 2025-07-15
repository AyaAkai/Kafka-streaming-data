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
exports.ConnectTool = exports.CONNECT_TOOL_NAME = void 0;
const vscode = require("vscode");
const tool_1 = require("../tool");
exports.CONNECT_TOOL_NAME = "pgsql_connect";
class ConnectTool extends tool_1.Tool {
    constructor(connectionManager) {
        super();
        this.connectionManager = connectionManager;
        this.toolName = exports.CONNECT_TOOL_NAME;
        this.description = "Connect to a PostgreSQL server using server name and optional database name.";
    }
    call(options, _token) {
        return __awaiter(this, void 0, void 0, function* () {
            const { serverName, database } = options.input;
            // Fetch all profiles and find the requested one
            const profiles = yield this.connectionManager.connectionStore.getConnectionQuickpickItems(false);
            const profile = profiles.find((p) => p.connectionCreds.profileName === serverName);
            if (!profile) {
                return JSON.stringify({
                    message: `Server with name '${serverName}' not found.`,
                    success: false,
                });
            }
            let creds = yield this.connectionManager.connectionUI.handleSelectedConnection(profile);
            const cleanedServerName = serverName.replace(/\//g, "_");
            const effectiveDatabase = database || profile.connectionCreds.database || undefined;
            let connectionId = `pgsql/${cleanedServerName}`;
            if (effectiveDatabase) {
                connectionId += `/${effectiveDatabase}`;
            }
            let success;
            let message;
            try {
                success = yield this.connectionManager.connect(connectionId, Object.assign(Object.assign({}, creds), { database: effectiveDatabase }));
                message = success ? "Successfully connected." : "Failed to connect.";
            }
            catch (err) {
                success = false;
                message = err instanceof Error ? err.message : String(err);
            }
            return JSON.stringify({ success, connectionId, message });
        });
    }
    prepareInvocation(options, _token) {
        return __awaiter(this, void 0, void 0, function* () {
            const { serverName, database } = options.input;
            const confirmationText = database
                ? `Connect to server '${serverName}' and database '${database}'?`
                : `Connect to server '${serverName}'?`;
            const confirmationMessages = {
                title: "pgsql: Connect to Database Server",
                message: new vscode.MarkdownString(confirmationText),
            };
            const invocationMessage = `Connecting to server '${serverName}'${database ? ` and database '${database}'` : ""}`;
            return { invocationMessage, confirmationMessages };
        });
    }
}
exports.ConnectTool = ConnectTool;

//# sourceMappingURL=connectTool.js.map
