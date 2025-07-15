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
exports.DisconnectTool = exports.DISCONNECT_TOOL_NAME = void 0;
const vscode = require("vscode");
const tool_1 = require("../tool");
exports.DISCONNECT_TOOL_NAME = "pgsql_disconnect";
class DisconnectTool extends tool_1.Tool {
    constructor(connectionManager) {
        super();
        this.connectionManager = connectionManager;
        this.toolName = exports.DISCONNECT_TOOL_NAME;
    }
    call(options, _token) {
        return __awaiter(this, void 0, void 0, function* () {
            const { connectionId } = options.input;
            yield this.connectionManager.disconnect(connectionId);
            return JSON.stringify({ success: true });
        });
    }
    prepareInvocation(options, _token) {
        return __awaiter(this, void 0, void 0, function* () {
            const { connectionId } = options.input;
            const confirmationText = `Disconnect from connection '${connectionId}'?`;
            const confirmationMessages = {
                title: `pgsql: Disconnect`,
                message: new vscode.MarkdownString(confirmationText),
            };
            const invocationMessage = `Disconnecting from connection '${connectionId}'`;
            return { invocationMessage, confirmationMessages };
        });
    }
}
exports.DisconnectTool = DisconnectTool;

//# sourceMappingURL=disconnectTool.js.map
