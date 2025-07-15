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
exports.Tool = void 0;
const vscode = require("vscode");
const telemetry_1 = require("../../../telemetry/telemetry");
const telemetry_2 = require("../../../sharedInterfaces/telemetry");
class Tool {
    invoke(options, _token) {
        return __awaiter(this, void 0, void 0, function* () {
            const telemetryActivity = (0, telemetry_1.startActivity)(telemetry_2.TelemetryViews.CopilotChat, telemetry_2.TelemetryActions.CopilotAgentModeToolCall, `${options.toolInvocationToken}`, {
                toolName: this.toolName,
            });
            try {
                const response = yield this.call(options, _token);
                telemetryActivity.end(telemetry_2.ActivityStatus.Succeeded);
                return new vscode.LanguageModelToolResult([new vscode.LanguageModelTextPart(response)]);
            }
            catch (error) {
                telemetryActivity.endFailed(error);
                // Return a structured error payload for any uncaught exception
                const errorPayload = {
                    isError: true,
                    message: error instanceof Error ? error.message : String(error),
                };
                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(JSON.stringify(errorPayload)),
                ]);
            }
        });
    }
}
exports.Tool = Tool;

//# sourceMappingURL=tool.js.map
