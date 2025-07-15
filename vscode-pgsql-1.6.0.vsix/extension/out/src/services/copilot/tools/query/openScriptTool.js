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
exports.OpenScriptTool = void 0;
const vscode = require("vscode");
const tool_1 = require("../tool");
class OpenScriptTool extends tool_1.Tool {
    constructor(_connectionManager, _untitledDocService) {
        super();
        this._connectionManager = _connectionManager;
        this._untitledDocService = _untitledDocService;
        this.toolName = "pgsql_open_script";
    }
    call(options, _token) {
        return __awaiter(this, void 0, void 0, function* () {
            const { connectionId, script } = options.input;
            try {
                // Open a new untitled SQL document with the provided script content
                const editor = yield this._untitledDocService.newQuery(script);
                const newUri = editor.document.uri.toString(true);
                // Transfer the existing connection to the new document
                yield this._connectionManager.transferFileConnection(connectionId, newUri, false);
                const result = { uri: newUri, success: true };
                return JSON.stringify(result);
            }
            catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                const result = { uri: "", success: false, message };
                return JSON.stringify(result);
            }
        });
    }
    prepareInvocation(options, _token) {
        return __awaiter(this, void 0, void 0, function* () {
            const { connectionId } = options.input;
            const confirmationText = `Open a new script editor for connection '${connectionId}'?`;
            return {
                invocationMessage: `Open script editor for connection '${connectionId}'`,
                confirmationMessages: {
                    title: "pgsql: Open Script",
                    message: new vscode.MarkdownString(confirmationText),
                },
            };
        });
    }
}
exports.OpenScriptTool = OpenScriptTool;

//# sourceMappingURL=openScriptTool.js.map
