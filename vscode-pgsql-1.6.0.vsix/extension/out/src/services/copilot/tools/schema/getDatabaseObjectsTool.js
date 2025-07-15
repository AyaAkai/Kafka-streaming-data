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
exports.GetDatabaseObjectsTool = exports.GetDatabaseObjectsRequest = void 0;
const vscode = require("vscode");
const vscode_languageclient_1 = require("vscode-languageclient");
const tool_1 = require("../tool");
/** Request type for fetching database objects. */
var GetDatabaseObjectsRequest;
(function (GetDatabaseObjectsRequest) {
    GetDatabaseObjectsRequest.type = new vscode_languageclient_1.RequestType("tools/fetch-db-objects");
})(GetDatabaseObjectsRequest || (exports.GetDatabaseObjectsRequest = GetDatabaseObjectsRequest = {}));
/** Tool implementation that fetches CREATE scripts for database objects. */
class GetDatabaseObjectsTool extends tool_1.Tool {
    constructor(client, results) {
        super();
        this.client = client;
        this.results = results;
        this.toolName = "pgsql_db_context";
    }
    call(options, _token) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.client.sendRequest(GetDatabaseObjectsRequest.type, options.input);
            const result = yield this.results.waitForResult(response.responseId);
            return JSON.stringify(result);
        });
    }
    prepareInvocation(options, _token) {
        return __awaiter(this, void 0, void 0, function* () {
            const { connectionId, objectType, schemaName } = options.input;
            const schemaText = schemaName ? `schema '${schemaName}'` : "all schemas";
            const confirmationText = `Fetch ${objectType} for ${schemaText} on connection '${connectionId}'?`;
            return {
                invocationMessage: `Fetching ${objectType} for ${schemaText} on connection '${connectionId}'`,
                confirmationMessages: {
                    title: "pgsql: Fetch Database Objects",
                    message: new vscode.MarkdownString(confirmationText),
                },
            };
        });
    }
}
exports.GetDatabaseObjectsTool = GetDatabaseObjectsTool;

//# sourceMappingURL=getDatabaseObjectsTool.js.map
