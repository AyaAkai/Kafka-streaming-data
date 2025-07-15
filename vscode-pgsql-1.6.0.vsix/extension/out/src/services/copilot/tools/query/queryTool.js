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
exports.QueryTool = exports.QueryRequest = void 0;
const vscode = require("vscode");
const vscode_languageclient_1 = require("vscode-languageclient");
const tool_1 = require("../tool");
var QueryRequest;
(function (QueryRequest) {
    QueryRequest.type = new vscode_languageclient_1.RequestType("tools/query");
})(QueryRequest || (exports.QueryRequest = QueryRequest = {}));
class QueryTool extends tool_1.Tool {
    constructor(client, results) {
        super();
        this.client = client;
        this.results = results;
        this.toolName = "pgsql_query";
        this.description = "Query a PostgreSQL database";
    }
    call(options, _token) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.client.sendRequest(QueryRequest.type, options.input);
            const result = yield this.results.waitForResult(response.responseId);
            return JSON.stringify(result);
        });
    }
    prepareInvocation(options, _token) {
        return __awaiter(this, void 0, void 0, function* () {
            const { connectionId } = options.input;
            const confirmationText = `Run query '${options.input.queryName}' against connection '${connectionId}'?`;
            return {
                invocationMessage: `Running query '${options.input.queryName}' against connection '${connectionId}'.`,
                confirmationMessages: {
                    title: "pgsql: Query Database",
                    message: new vscode.MarkdownString(confirmationText),
                },
            };
        });
    }
}
exports.QueryTool = QueryTool;

//# sourceMappingURL=queryTool.js.map
