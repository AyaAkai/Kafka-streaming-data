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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LanguageModelCompletion = void 0;
const vscode = require("vscode");
const Constants = require("../../../constants/constants");
const messages_1 = require("./messages");
const telemetry_1 = require("../../../telemetry/telemetry");
const telemetry_2 = require("../../../sharedInterfaces/telemetry");
// Message appended to history when returning a function result.
const TOOL_CALL_RESULT_CONTINUATION_PROMPT = "<SYSTEM_MESSAGE> " +
    "Above is the result of calling one or more tools. The user cannot see the results, so you should explain them to the user if referencing them in your answer. " +
    "If other function calls will result in a better or more accurate answer, please call them. " +
    "Only return the final answer when no other function calls - e.g. fetching database context - can improve the answer. " +
    "</SYSTEM_MESSAGE>";
/**
 * LanguageModelCompletion handles completion requests to the language model and sends results
 * back to the language server (pgsql-tools).
 * It is what backs the Semantic Kernel VSCodeCompletionClient in pgsql-tools.
 * This class does not deal with "inline completions", but instead deals with the "chat completions" API.
 * Chat Completions is the name for the API that allows for a conversation with the language model,
 * see OpenAI API docs on chat completions for more details.
 */
class LanguageModelCompletion {
    constructor(_client) {
        this._client = _client;
    }
    handleLMCompletionRequest(completionRequest, model, chatId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, e_1, _b, _c;
            const requestId = completionRequest.requestId;
            const modelOptions = this.getModelOptions(completionRequest);
            const tools = completionRequest.tools;
            const justification = completionRequest.justification;
            var messages = [];
            for (const message of completionRequest.messages) {
                var role = message.role === messages_1.VSCodeLanguageModelChatMessageRole.USER
                    ? vscode.LanguageModelChatMessageRole.User
                    : vscode.LanguageModelChatMessageRole.Assistant;
                const content = [];
                for (const part of message.content) {
                    if ((0, messages_1.isVSCodeLanguageModelTextPart)(part)) {
                        content.push(new vscode.LanguageModelTextPart(part.value));
                    }
                    else if ((0, messages_1.isVSCodeLanguageModelToolResultPart)(part)) {
                        content.push(new vscode.LanguageModelToolResultPart(part.callId, part.content.map((part) => new vscode.LanguageModelTextPart(part.value))));
                    }
                    else if ((0, messages_1.isVSCodeLanguageModelToolCallPart)(part)) {
                        content.push(new vscode.LanguageModelToolCallPart(part.callId, part.name, part.input));
                    }
                    messages.push(new vscode.LanguageModelChatMessage(role, content, message.name));
                }
            }
            // The language model doesn't yet support sending across tool results directly. So we need to
            // capture them in a user message.
            // Check if last message is a User message with only LanguageModelTextPart content
            // if not, then add a User message asking for the model to continue.
            // Error: Invalid request: the last message must be a User message without a tool result.
            const lastMessage = messages[messages.length - 1];
            const allTextParts = lastMessage.content.every(messages_1.isVSCodeLanguageModelTextPart);
            if (lastMessage.role !== vscode.LanguageModelChatMessageRole.User || !allTextParts) {
                // Add a user message asking for the model to continue
                messages.push(new vscode.LanguageModelChatMessage(vscode.LanguageModelChatMessageRole.User, [
                    new vscode.LanguageModelTextPart(TOOL_CALL_RESULT_CONTINUATION_PROMPT),
                ]));
            }
            const options = {
                justification: justification,
                modelOptions: modelOptions,
                toolMode: vscode.LanguageModelChatToolMode.Auto,
                tools: tools.map((tool) => {
                    return {
                        name: tool.name,
                        description: tool.description,
                        inputSchema: tool.inputSchema,
                    };
                }),
            };
            // Hacky workaround tohttps://github.com/microsoft/vscode-copilot-release/issues/8040
            // Claude 3.5 Sonnet fails whenever doing a tool call to a tool with no parameters.
            // Users will see the model say it will go fetch info etc, and then the conversation
            // stops - very confusing behavior.
            // Adding a dummy parameter to the tool input schema as a required parameter
            // allows the tool call to be made. The extra parameter is not passed to the
            // Semantic Kernel function in pgsql-tools.
            if (model.id === "claude-3.5-sonnet") {
                for (const tool of options.tools) {
                    if (tool.inputSchema && Object.keys(tool.inputSchema["properties"]).length === 0) {
                        tool.inputSchema["properties"] = {
                            dummy_parameter: {
                                type: "string",
                                description: "A dummy parameter for tools with no input schema.",
                            },
                        };
                        tool.inputSchema["required"] = ["dummy_parameter"];
                    }
                }
            }
            var toolsCalled = false;
            const telemetryActivity = (0, telemetry_1.startActivity)(telemetry_2.TelemetryViews.CopilotChat, telemetry_2.TelemetryActions.CopilotCompletion, chatId, {
                modelName: model.name,
                modelVersion: model.version,
                modelFamily: model.family,
                modelOptions: JSON.stringify(modelOptions),
                chatId: chatId,
            });
            try {
                var chatResponse = yield model.sendRequest(messages, options, new vscode.CancellationTokenSource().token);
                try {
                    for (var _d = true, _e = __asyncValues(chatResponse.stream), _f; _f = yield _e.next(), _a = _f.done, !_a; _d = true) {
                        _c = _f.value;
                        _d = false;
                        const chunk = _c;
                        // Construct the response message
                        const notification = new messages_1.VSCodeLanguageModelChatCompletionResponse();
                        notification.requestId = requestId;
                        if (chunk instanceof vscode.LanguageModelTextPart) {
                            notification.response = new messages_1.VSCodeLanguageModelTextPart();
                            notification.response.value = chunk.value;
                        }
                        else if (chunk instanceof vscode.LanguageModelToolCallPart) {
                            notification.response = new messages_1.VSCodeLanguageModelToolCallPart();
                            notification.response.callId = chunk.callId;
                            notification.response.name = chunk.name;
                            notification.response.input = chunk.input;
                            toolsCalled = true;
                        }
                        else {
                            notification.response = new messages_1.VSCodeLanguageModelCompleteResultPart();
                            notification.response.finishReason =
                                messages_1.VSCodeLanguageModelCompletionFinishReason.ERROR;
                            notification.response.errorMessage = `Unsupported response type: ${chunk}`;
                        }
                        this._client.sendNotification(messages_1.VSCodeLanguageModelChatCompletionResponseNotification.type, notification);
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (!_d && !_a && (_b = _e.return)) yield _b.call(_e);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
            }
            catch (err) {
                const notification = new messages_1.VSCodeLanguageModelChatCompletionResponse();
                notification.requestId = requestId;
                notification.response = new messages_1.VSCodeLanguageModelCompleteResultPart();
                notification.response.finishReason = messages_1.VSCodeLanguageModelCompletionFinishReason.ERROR;
                notification.response.errorMessage = err.message;
                telemetryActivity.endFailed(Error(err.message), true, err.code);
                this._client.sendNotification(messages_1.VSCodeLanguageModelChatCompletionResponseNotification.type, notification);
                if (err instanceof vscode.LanguageModelError) {
                    console.log(err.message, err.code);
                }
                else {
                    throw err;
                }
                return;
            }
            telemetryActivity.end(telemetry_2.ActivityStatus.Succeeded);
            const notification = new messages_1.VSCodeLanguageModelChatCompletionResponse();
            notification.requestId = requestId;
            notification.response = new messages_1.VSCodeLanguageModelCompleteResultPart();
            notification.response.finishReason = toolsCalled
                ? messages_1.VSCodeLanguageModelCompletionFinishReason.TOOL_CALLS
                : messages_1.VSCodeLanguageModelCompletionFinishReason.STOP;
            this._client.sendNotification(messages_1.VSCodeLanguageModelChatCompletionResponseNotification.type, notification);
        });
    }
    getModelOptions(completionRequest) {
        var _a, _b, _c;
        const modelOptions = completionRequest.modelOptions;
        // Fetch model configuration from pgsql.copilot.modelOptions settings
        const settingsModelOptions = vscode.workspace
            .getConfiguration(Constants.configChatSectionName)
            .get(Constants.configChatModelOptions);
        // Note: VSCode camel-cases the settings keys.
        modelOptions["max_tokens"] = (_a = settingsModelOptions === null || settingsModelOptions === void 0 ? void 0 : settingsModelOptions["maxTokens"]) !== null && _a !== void 0 ? _a : 10000;
        modelOptions["temperature"] = (_b = settingsModelOptions === null || settingsModelOptions === void 0 ? void 0 : settingsModelOptions["temperature"]) !== null && _b !== void 0 ? _b : 0.7;
        modelOptions["top_p"] = (_c = settingsModelOptions === null || settingsModelOptions === void 0 ? void 0 : settingsModelOptions["topP"]) !== null && _c !== void 0 ? _c : 0.8;
        return modelOptions;
    }
}
exports.LanguageModelCompletion = LanguageModelCompletion;

//# sourceMappingURL=languageModelCompletion.js.map
