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
exports.ModifyTool = exports.ModifyRequest = void 0;
const vscode = require("vscode");
const tool_1 = require("../tool");
const vscode_languageclient_1 = require("vscode-languageclient");
/** Request type for executing a modification statement. */
var ModifyRequest;
(function (ModifyRequest) {
    ModifyRequest.type = new vscode_languageclient_1.RequestType("tools/modify");
})(ModifyRequest || (exports.ModifyRequest = ModifyRequest = {}));
/** Tool that executes a SQL statement to modify the database. */
class ModifyTool extends tool_1.Tool {
    constructor(client, results) {
        super();
        this.client = client;
        this.results = results;
        this.toolName = "pgsql_modify";
        this.description = "Execute a SQL modification statement against the database connection.";
    }
    call(options, _token) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.client.sendRequest(ModifyRequest.type, options.input);
            const result = yield this.results.waitForResult(response.responseId);
            return JSON.stringify(result);
        });
    }
    prepareInvocation(options, _token) {
        return __awaiter(this, void 0, void 0, function* () {
            const { connectionId, statementName } = options.input;
            const confirmationText = `Execute modification '${statementName}' on connection '${connectionId}'?`;
            return {
                invocationMessage: `Executing modification '${statementName}' on connection '${connectionId}'`,
                confirmationMessages: {
                    title: "pgsql: Modify Database",
                    message: new vscode.MarkdownString(confirmationText),
                },
            };
        });
    }
}
exports.ModifyTool = ModifyTool;

//# sourceMappingURL=modifyTool.js.map
