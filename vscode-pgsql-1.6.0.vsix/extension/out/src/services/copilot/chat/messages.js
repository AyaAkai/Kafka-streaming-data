"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatCompletionContentNotification = exports.ChatCompletionContent = exports.CopilotQueryNotification = exports.CopilotQueryNotificationParams = exports.FunctionCallErrorNotification = exports.ChatFunctionCallErrorNotificationParams = exports.FunctionCallNotification = exports.ChatFunctionCallNotificationParams = exports.ChatCompletionRequest = exports.ChatCompletionRequestResult = exports.ChatCompletionRequestParams = exports.AzureToken = exports.ChatMessageContent = exports.CopilotAccessMode = void 0;
const vscode_languageclient_1 = require("vscode-languageclient");
var CopilotAccessMode;
(function (CopilotAccessMode) {
    CopilotAccessMode["ReadOnly"] = "ro";
    CopilotAccessMode["ReadWrite"] = "rw";
})(CopilotAccessMode || (exports.CopilotAccessMode = CopilotAccessMode = {}));
class ChatMessageContent {
}
exports.ChatMessageContent = ChatMessageContent;
class AzureToken {
    static createAzureToken(token, expiresOn) {
        const azureToken = new AzureToken();
        azureToken.token = token;
        azureToken.expiry = expiresOn;
        return azureToken;
    }
}
exports.AzureToken = AzureToken;
class ChatCompletionRequestParams {
}
exports.ChatCompletionRequestParams = ChatCompletionRequestParams;
class ChatCompletionRequestResult {
}
exports.ChatCompletionRequestResult = ChatCompletionRequestResult;
var ChatCompletionRequest;
(function (ChatCompletionRequest) {
    ChatCompletionRequest.type = new vscode_languageclient_1.RequestType("chat/completion-request");
})(ChatCompletionRequest || (exports.ChatCompletionRequest = ChatCompletionRequest = {}));
class ChatFunctionCallNotificationParams {
}
exports.ChatFunctionCallNotificationParams = ChatFunctionCallNotificationParams;
var FunctionCallNotification;
(function (FunctionCallNotification) {
    FunctionCallNotification.type = new vscode_languageclient_1.NotificationType("chat/function-call-notification");
})(FunctionCallNotification || (exports.FunctionCallNotification = FunctionCallNotification = {}));
class ChatFunctionCallErrorNotificationParams {
}
exports.ChatFunctionCallErrorNotificationParams = ChatFunctionCallErrorNotificationParams;
var FunctionCallErrorNotification;
(function (FunctionCallErrorNotification) {
    FunctionCallErrorNotification.type = new vscode_languageclient_1.NotificationType("chat/function-call-error-notification");
})(FunctionCallErrorNotification || (exports.FunctionCallErrorNotification = FunctionCallErrorNotification = {}));
class CopilotQueryNotificationParams {
}
exports.CopilotQueryNotificationParams = CopilotQueryNotificationParams;
var CopilotQueryNotification;
(function (CopilotQueryNotification) {
    CopilotQueryNotification.type = new vscode_languageclient_1.NotificationType("chat/notify-copilot-query");
})(CopilotQueryNotification || (exports.CopilotQueryNotification = CopilotQueryNotification = {}));
class ChatCompletionContent {
}
exports.ChatCompletionContent = ChatCompletionContent;
var ChatCompletionContentNotification;
(function (ChatCompletionContentNotification) {
    ChatCompletionContentNotification.type = new vscode_languageclient_1.NotificationType("chat/completion-result");
})(ChatCompletionContentNotification || (exports.ChatCompletionContentNotification = ChatCompletionContentNotification = {}));

//# sourceMappingURL=messages.js.map
