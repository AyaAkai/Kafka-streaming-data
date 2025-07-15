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
exports.PgsqlAgentTool = exports.PgsqlAgentRequest = void 0;
const vscode = require("vscode");
const vscode_languageclient_1 = require("vscode-languageclient");
const tool_1 = require("../tool");
var PgsqlAgentRequest;
(function (PgsqlAgentRequest) {
    PgsqlAgentRequest.type = new vscode_languageclient_1.RequestType("tools/agent/pgsql");
})(PgsqlAgentRequest || (exports.PgsqlAgentRequest = PgsqlAgentRequest = {}));
class PgsqlAgentTool extends tool_1.Tool {
    constructor(client, results) {
        super();
        this.client = client;
        this.results = results;
        this.toolName = "pgsql_agent";
    }
    call(options, _token) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            let activeEditorUri;
            let activeEditorSelection;
            const activeEditor = vscode.window.activeTextEditor;
            if (activeEditor) {
                activeEditorUri = activeEditor.document.uri.toString(true);
                if (((_a = activeEditor.selections) === null || _a === void 0 ? void 0 : _a.length) === 1) {
                    if (!activeEditor.selection.isEmpty) {
                        let selection = activeEditor.selection;
                        activeEditorSelection = {
                            startLine: selection.start.line,
                            startColumn: selection.start.character,
                            endLine: selection.end.line,
                            endColumn: selection.end.character,
                        };
                    }
                }
            }
            const params = {
                message: options.input.message,
                history: options.input.history,
                connectionIds: options.input.connectionIds,
                activeEditorUri: activeEditorUri,
                activeEditorSelection: activeEditorSelection,
            };
            const response = yield this.client.sendRequest(PgsqlAgentRequest.type, params);
            const result = yield this.results.waitForResult(response.responseId);
            return JSON.stringify(result);
        });
    }
    prepareInvocation(options, _token) {
        return __awaiter(this, void 0, void 0, function* () {
            const confirmationText = `Consult the #pgsql agent to help with this task?`;
            return {
                invocationMessage: `Asking #pgsql for ideas`,
                confirmationMessages: {
                    title: "pgsql: Ask #pgsql for ideas",
                    message: new vscode.MarkdownString(confirmationText),
                },
            };
        });
    }
}
exports.PgsqlAgentTool = PgsqlAgentTool;

//# sourceMappingURL=pgsqlAgentTool.js.map
