"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.VSCodeLanguageModelChatCompletionResponseNotification = exports.VSCodeLanguageModelChatCompletionResponse = exports.VSCodeLanguageModelCompletionRequestNotification = exports.VSCodeLanguageModelCompletionRequestParams = exports.VSCodeLanguageModelChatTool = exports.VSCodeLanguageModelChatMessage = exports.VSCodeLanguageModelChatMessageRole = exports.VSCodeLanguageModelCompleteResultPart = exports.VSCodeLanguageModelToolResultPart = exports.VSCodeLanguageModelToolCallPart = exports.VSCodeLanguageModelTextPart = exports.VSCodeLanguageModelCompletionFinishReason = void 0;
exports.isVSCodeLanguageModelTextPart = isVSCodeLanguageModelTextPart;
exports.isVSCodeLanguageModelToolResultPart = isVSCodeLanguageModelToolResultPart;
exports.isVSCodeLanguageModelToolCallPart = isVSCodeLanguageModelToolCallPart;
const vscode_languageclient_1 = require("vscode-languageclient");
const LM_CHAT_COMPLETION_REQUEST_METHOD = "chat/vscode-lm-completion-request";
const LM_COMPLETION_RESPONSE_METHOD = "chat/vscode-lm-response";
var VSCodeLanguageModelCompletionFinishReason;
(function (VSCodeLanguageModelCompletionFinishReason) {
    VSCodeLanguageModelCompletionFinishReason["STOP"] = "stop";
    VSCodeLanguageModelCompletionFinishReason["LENGTH"] = "length";
    VSCodeLanguageModelCompletionFinishReason["CONTENT_FILTER"] = "content_filter";
    VSCodeLanguageModelCompletionFinishReason["TOOL_CALLS"] = "tool_calls";
    VSCodeLanguageModelCompletionFinishReason["FUNCTION_CALL"] = "function_call";
    VSCodeLanguageModelCompletionFinishReason["ERROR"] = "error";
})(VSCodeLanguageModelCompletionFinishReason || (exports.VSCodeLanguageModelCompletionFinishReason = VSCodeLanguageModelCompletionFinishReason = {}));
class VSCodeLanguageModelTextPart {
}
exports.VSCodeLanguageModelTextPart = VSCodeLanguageModelTextPart;
class VSCodeLanguageModelToolCallPart {
}
exports.VSCodeLanguageModelToolCallPart = VSCodeLanguageModelToolCallPart;
class VSCodeLanguageModelToolResultPart {
}
exports.VSCodeLanguageModelToolResultPart = VSCodeLanguageModelToolResultPart;
class VSCodeLanguageModelCompleteResultPart {
}
exports.VSCodeLanguageModelCompleteResultPart = VSCodeLanguageModelCompleteResultPart;
var VSCodeLanguageModelChatMessageRole;
(function (VSCodeLanguageModelChatMessageRole) {
    VSCodeLanguageModelChatMessageRole["USER"] = "user";
    VSCodeLanguageModelChatMessageRole["ASSISTANT"] = "assistant";
})(VSCodeLanguageModelChatMessageRole || (exports.VSCodeLanguageModelChatMessageRole = VSCodeLanguageModelChatMessageRole = {}));
class VSCodeLanguageModelChatMessage {
}
exports.VSCodeLanguageModelChatMessage = VSCodeLanguageModelChatMessage;
class VSCodeLanguageModelChatTool {
}
exports.VSCodeLanguageModelChatTool = VSCodeLanguageModelChatTool;
class VSCodeLanguageModelCompletionRequestParams {
}
exports.VSCodeLanguageModelCompletionRequestParams = VSCodeLanguageModelCompletionRequestParams;
var VSCodeLanguageModelCompletionRequestNotification;
(function (VSCodeLanguageModelCompletionRequestNotification) {
    VSCodeLanguageModelCompletionRequestNotification.type = new vscode_languageclient_1.NotificationType(LM_CHAT_COMPLETION_REQUEST_METHOD);
})(VSCodeLanguageModelCompletionRequestNotification || (exports.VSCodeLanguageModelCompletionRequestNotification = VSCodeLanguageModelCompletionRequestNotification = {}));
class VSCodeLanguageModelChatCompletionResponse {
}
exports.VSCodeLanguageModelChatCompletionResponse = VSCodeLanguageModelChatCompletionResponse;
var VSCodeLanguageModelChatCompletionResponseNotification;
(function (VSCodeLanguageModelChatCompletionResponseNotification) {
    VSCodeLanguageModelChatCompletionResponseNotification.type = new vscode_languageclient_1.NotificationType(LM_COMPLETION_RESPONSE_METHOD);
})(VSCodeLanguageModelChatCompletionResponseNotification || (exports.VSCodeLanguageModelChatCompletionResponseNotification = VSCodeLanguageModelChatCompletionResponseNotification = {}));
// -- Type Guards --
function isVSCodeLanguageModelTextPart(part) {
    return part.value !== undefined;
}
function isVSCodeLanguageModelToolResultPart(part) {
    return (part.callId !== undefined &&
        part.content !== undefined);
}
function isVSCodeLanguageModelToolCallPart(part) {
    return (part.callId !== undefined &&
        part.name !== undefined);
}

//# sourceMappingURL=messages.js.map
