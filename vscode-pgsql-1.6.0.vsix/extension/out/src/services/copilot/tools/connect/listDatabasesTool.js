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
exports.ListDatabasesTool = exports.ListDatabasesRequest = void 0;
const vscode = require("vscode");
const tool_1 = require("../tool");
const vscode_languageclient_1 = require("vscode-languageclient");
var ListDatabasesRequest;
(function (ListDatabasesRequest) {
    ListDatabasesRequest.type = new vscode_languageclient_1.RequestType("tools/list-databases");
})(ListDatabasesRequest || (exports.ListDatabasesRequest = ListDatabasesRequest = {}));
class ListDatabasesTool extends tool_1.Tool {
    constructor(client, results) {
        super();
        this.client = client;
        this.results = results;
        this.toolName = "pgsql_list_databases";
        this.description = "List all databases on the connected PostgreSQL server. Use this tool to discover other databases available on the server, given a connection to any database. This is strictly read-only and does not modify any data. Returns a list of database names.";
    }
    call(options, _token) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.client.sendRequest(ListDatabasesRequest.type, options.input);
            const result = yield this.results.waitForResult(response.responseId);
            return JSON.stringify(result);
        });
    }
    prepareInvocation(options, _token) {
        return __awaiter(this, void 0, void 0, function* () {
            const { connectionId } = options.input;
            const confirmationText = `List all databases for connection '${connectionId}'?`;
            const confirmationMessages = {
                title: "pgsql: List Databases",
                message: new vscode.MarkdownString(confirmationText),
            };
            const invocationMessage = `Listing all databases for connection '${connectionId}'.`;
            return { invocationMessage, confirmationMessages };
        });
    }
}
exports.ListDatabasesTool = ListDatabasesTool;

//# sourceMappingURL=listDatabasesTool.js.map
