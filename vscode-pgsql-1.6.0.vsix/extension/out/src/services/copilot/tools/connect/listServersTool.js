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
exports.ListServersTool = void 0;
const vscode = require("vscode");
const tool_1 = require("../tool");
/** Tool implementation for listing database servers from local profiles. */
class ListServersTool extends tool_1.Tool {
    constructor(connectionManager) {
        super();
        this.connectionManager = connectionManager;
        this.toolName = "pgsql_list_servers";
        this.description = "List all database servers registered with the PGSQL extension.";
    }
    call(options, _token) {
        return __awaiter(this, void 0, void 0, function* () {
            // Fetch all servers from the connection store
            const profiles = yield this.connectionManager.connectionStore.readAllConnections(false);
            // Map to server profiles
            const servers = profiles.map((p) => ({
                serverId: p.id,
                serverName: p.profileName,
                hostName: p.server,
                defaultDatabase: p.database || "postgres",
            }));
            return JSON.stringify({ servers });
        });
    }
    prepareInvocation(options, _token) {
        return __awaiter(this, void 0, void 0, function* () {
            const confirmationMessages = {
                title: "pgsql: List Database Servers",
                message: new vscode.MarkdownString("List all database servers registered with the pgsql extension?"),
            };
            return {
                invocationMessage: "Listing server connections",
                confirmationMessages,
            };
        });
    }
}
exports.ListServersTool = ListServersTool;

//# sourceMappingURL=listServersTool.js.map
