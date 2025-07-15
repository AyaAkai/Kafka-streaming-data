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
exports.ChatService = void 0;
const vscode = require("vscode");
const azureController_1 = require("../../../azure/azureController");
const Constants = require("../../../constants/constants");
const LocalizedConstants = require("../../../constants/locConstants");
const vscodeWrapper_1 = require("../../../controllers/vscodeWrapper");
const connectionInfo_1 = require("../../../models/connectionInfo");
const logger_1 = require("../../../models/logger");
const objectExplorerUtils_1 = require("../../../objectExplorer/objectExplorerUtils");
const telemetry_1 = require("../../../sharedInterfaces/telemetry");
const telemetry_2 = require("../../../telemetry/telemetry");
const languageModelCompletion_1 = require("../completion/languageModelCompletion");
const messages_1 = require("../completion/messages");
const connectTool_1 = require("../tools/connect/connectTool");
const messages_2 = require("./messages");
const Prompts = require("./prompts");
const utils_1 = require("./utils");
const CHAT_PARTICIPANT_ID = "vscode-postgresql.chat-agent";
const CONNECTED_PREFIX = "> 🟢 Connected";
const DISCONNECTED_PREFIX = "> 🔴 Disconnected!";
// Internal types kept with ChatService:
class ChatInstanceFinishInfo {
    constructor() {
        this.finishReason = messages_1.VSCodeLanguageModelCompletionFinishReason.STOP;
        this.isError = false;
        this.errorMessage = undefined;
    }
}
/**
 * Represents information about a chat instance, including its configuration,
 * state, and associated telemetry activity. A chat instance is one
 * chat within a chat session; a chat session is the ongoing thread in the conversation.
 */
class ChatInstanceInfo {
    constructor(chatId, sessionId, model, stream, token) {
        this.chatId = chatId;
        this.sessionId = sessionId;
        this.model = model;
        this.stream = stream;
        this.token = token;
        this.promise = new Promise((resolve) => {
            this.completeChat = resolve;
        });
    }
}
class ChatService {
    constructor(_context, 
    // The notification sent by PGTS to update progress.
    // Used to indicate which Kernel functions (tools) are being called.
    _client, _vscodeWrapper, _connectionManager, _getQueryHistoryProvider, _getQueryResultWebViewController) {
        this._context = _context;
        this._client = _client;
        this._vscodeWrapper = _vscodeWrapper;
        this._connectionManager = _connectionManager;
        this._getQueryHistoryProvider = _getQueryHistoryProvider;
        this._getQueryResultWebViewController = _getQueryResultWebViewController;
        this._activeChatInstances = new Map();
        // Tracks connection profile names per session;
        // used to detect when the connection changes.
        this._sessionConnections = new Map();
        // ARM tokens keyed by account and tenant
        this._armTokenCache = new Map();
        if (!_vscodeWrapper) {
            this._vscodeWrapper = new vscodeWrapper_1.default();
        }
        this._logger = logger_1.Logger.create(this._vscodeWrapper.outputChannel, "ChatService");
        // The notification sent by PGTS to send telemtry and update progress.
        // Used to indicate which Kernel functions (tools) are being called.
        this._client.onNotification(messages_2.FunctionCallNotification.type, (notification) => this.handleFunctionCallNotification(notification));
        // Sent when there is a tool error, to collect telemetry.
        this._client.onNotification(messages_2.FunctionCallErrorNotification.type, (notification) => (0, telemetry_2.sendActionEvent)(telemetry_1.TelemetryViews.CopilotChat, telemetry_1.TelemetryActions.CopilotFunctionCallError, {
            functionName: notification.functionName,
            chatId: notification.chatId,
        }));
        // The notification sent by PGTS to update the chat stream with completion content.
        this._client.onNotification(messages_2.ChatCompletionContentNotification.type, (completionContent) => this.handleCompletionContent(completionContent));
        // Instantiate LanguageModelCompletion to handle LM completions.
        this._languageModelCompletion = new languageModelCompletion_1.LanguageModelCompletion(this._client);
        // The notification used by the VSCodeChatCompletion to request completions from the language model.
        // Using a notification here as pgtoolservice doesn't yet support request/response
        // coming from the language server.
        this._client.onNotification(messages_1.VSCodeLanguageModelCompletionRequestNotification.type, (completionRequest) => __awaiter(this, void 0, void 0, function* () {
            // Find the active conversation
            const chatInstance = this._activeChatInstances.get(completionRequest.chatId);
            let model = undefined;
            if (chatInstance) {
                model = chatInstance.model;
            }
            else {
                for (const family of ["gpt-4o", "claude-3.5-sonnet"]) {
                    const selection = yield vscode.lm.selectChatModels({ family });
                    if (selection.length > 0) {
                        model = selection[0];
                        break;
                    }
                }
                if (!model) {
                    for (const vendor of ["copilot"]) {
                        const selection = yield vscode.lm.selectChatModels({ vendor });
                        if (selection.length > 0) {
                            model = selection[0];
                            break;
                        }
                    }
                }
                if (!model) {
                    this._logger.error(`No language model available for completion request ${completionRequest.requestId}, chatId: ${completionRequest.chatId}, no chat instance.`);
                    throw new Error("No language model available for selection.");
                }
            }
            return yield this._languageModelCompletion.handleLMCompletionRequest(completionRequest, model, completionRequest.chatId);
        }));
        // Notification sent by Copilot when it runs a query or statement against the database.
        // Add it to the query history.
        this._client.onNotification(messages_2.CopilotQueryNotification.type, (params) => {
            var _a;
            const queryHistoryProvider = this._getQueryHistoryProvider();
            let modelName = undefined;
            if (params.chatId) {
                const chatInstance = this._activeChatInstances.get(params.chatId);
                modelName = (_a = chatInstance === null || chatInstance === void 0 ? void 0 : chatInstance.model) === null || _a === void 0 ? void 0 : _a.name;
            }
            if (queryHistoryProvider) {
                var queryString = `-- ${params.queryName}\n--\n`;
                var formattedDescription = (0, utils_1.wrapText)("Description: " + params.queryDescription, 80, "-- ", "Description: ".length);
                queryString += `${formattedDescription}\n`;
                queryString += `--\n-- Written by @${Constants.chatParticipantHandle}`;
                if (modelName) {
                    queryString += ` [${modelName}]\n`;
                }
                else {
                    queryString += `\n`;
                }
                queryString += `\n${params.query}`;
                const historyLabel = `@${Constants.chatParticipantHandle}: ${params.queryName}`;
                queryHistoryProvider.addCopilotQuery(historyLabel, queryString, params.ownerUri, params.hasError);
            }
        });
    }
    registerCommands(onNewQuery, onNewConnection) {
        const openAskModeChat = (prompt) => {
            // Open chat window
            vscode.commands.executeCommand("workbench.action.chat.open", {
                query: prompt,
                mode: "ask",
            });
        };
        const launchEditorChatWithPrompt = (prompt_1, ...args_1) => __awaiter(this, [prompt_1, ...args_1], void 0, function* (prompt, selectionPrompt = undefined) {
            const activeEditor = vscode.window.activeTextEditor;
            const uri = activeEditor === null || activeEditor === void 0 ? void 0 : activeEditor.document.uri.toString();
            const promptToUse = (activeEditor === null || activeEditor === void 0 ? void 0 : activeEditor.selection.isEmpty) || !selectionPrompt ? prompt : selectionPrompt;
            if (!uri) {
                // No active editor, so don't open chat
                // TODO: Show a message to the user
                return;
            }
            // create new connection
            if (!this._connectionManager.isConnected(uri)) {
                yield onNewConnection();
                (0, telemetry_2.sendActionEvent)(telemetry_1.TelemetryViews.CopilotChat, telemetry_1.TelemetryActions.CreateConnection);
            }
            // Open chat window
            openAskModeChat(promptToUse);
        });
        // -- CHAT WITH DATABASE --
        this._context.subscriptions.push(vscode.commands.registerCommand(Constants.cmdChatWithDatabase, (treeNodeInfo) => __awaiter(this, void 0, void 0, function* () {
            const connectionCredentials = Object.assign({}, treeNodeInfo.connectionInfo);
            const databaseName = objectExplorerUtils_1.ObjectExplorerUtils.getDatabaseName(treeNodeInfo);
            if (databaseName !== connectionCredentials.database &&
                databaseName !== LocalizedConstants.defaultDatabaseLabel) {
                connectionCredentials.database = databaseName;
            }
            else if (databaseName === LocalizedConstants.defaultDatabaseLabel) {
                connectionCredentials.database = "";
            }
            // Check if the active document already has this database as a connection.
            var alreadyActive = false;
            let activeEditor = vscode.window.activeTextEditor;
            if (activeEditor) {
                const uri = activeEditor.document.uri.toString();
                const connection = this._connectionManager.getConnectionInfo(uri);
                if (connection) {
                    if (connection.credentials.hostaddr ===
                        connectionCredentials.hostaddr &&
                        connection.credentials.user === connectionCredentials.user &&
                        connection.credentials.database === connectionCredentials.database) {
                        alreadyActive = true;
                    }
                }
            }
            if (!alreadyActive) {
                treeNodeInfo.updateConnectionInfo(connectionCredentials);
                yield onNewQuery(treeNodeInfo);
                // Check if the new editor was created
                activeEditor = vscode.window.activeTextEditor;
                if (activeEditor) {
                    const documentText = activeEditor.document.getText();
                    if (documentText.trim().length === 0) {
                        // The editor is empty; safe to insert text
                        const server = connectionCredentials.server;
                        yield activeEditor.edit((editBuilder) => {
                            editBuilder.insert(new vscode.Position(0, 0), `-- @${Constants.chatParticipantHandle} Chat Query Editor (${server})\n`);
                        });
                    }
                }
                else {
                    // The editor already contains text
                    this._logger.warn("Chat with database: unable to open editor");
                }
            }
            if (activeEditor) {
                // Open chat window
                openAskModeChat(Prompts.genericChatStart);
            }
            (0, telemetry_2.sendActionEvent)(telemetry_1.TelemetryViews.CopilotChat, telemetry_1.TelemetryActions.CopilotChatWithDatabase);
        })));
        // -- CONNECT DATABASE IN AGENT MODE --
        this._context.subscriptions.push(vscode.commands.registerCommand(Constants.cmdConnectDatabaseInAgentMode, (treeNodeInfo) => __awaiter(this, void 0, void 0, function* () {
            const connectionCredentials = Object.assign({}, treeNodeInfo.connectionInfo);
            const profileName = connectionCredentials.profileName;
            const databaseName = objectExplorerUtils_1.ObjectExplorerUtils.getDatabaseName(treeNodeInfo);
            let msg = `#${connectTool_1.CONNECT_TOOL_NAME} to the database`;
            if (profileName) {
                msg += ` with server name "${profileName}"`;
            }
            else {
                msg += ` with server host name "${connectionCredentials.server}"`;
            }
            if (databaseName && databaseName !== LocalizedConstants.defaultDatabaseLabel) {
                msg += ` and database name "${databaseName}"`;
            }
            else {
                msg += ` and the default database`;
            }
            msg += ", then await further instructions.";
            vscode.commands.executeCommand("workbench.action.chat.open", {
                query: msg,
                mode: "agent",
            });
            (0, telemetry_2.sendActionEvent)(telemetry_1.TelemetryViews.CopilotChat, telemetry_1.TelemetryActions.CopilotConnectDatabaseInAgentMode);
        })));
        // -- CHAT WITH EDITOR --
        this._context.subscriptions.push(vscode.commands.registerCommand(Constants.cmdChatWithEditor, () => __awaiter(this, void 0, void 0, function* () {
            // Check if the active document already has this database as a connection.
            const activeEditor = vscode.window.activeTextEditor;
            const uri = activeEditor.document.uri.toString();
            if (!this._connectionManager.isConnected(uri)) {
                this._logger.warn("Cannot chat with editor: No active connection");
            }
            // Open chat window
            openAskModeChat(Prompts.genericChatStart);
            (0, telemetry_2.sendActionEvent)(telemetry_1.TelemetryViews.CopilotChat, telemetry_1.TelemetryActions.CopilotChatWithQuery);
        })));
        // -- ANALYZE QUERY PERFORMANCE --
        this._context.subscriptions.push(vscode.commands.registerCommand(Constants.cmdAnalyzeQueryPerformance, () => __awaiter(this, void 0, void 0, function* () {
            yield launchEditorChatWithPrompt(Prompts.analyzeQueryPerformancePrompt);
            (0, telemetry_2.sendActionEvent)(telemetry_1.TelemetryViews.CopilotChat, telemetry_1.TelemetryActions.CopilotAnalyzeCommand);
        })));
        // -- EXPLAIN QUERY --
        this._context.subscriptions.push(vscode.commands.registerCommand(Constants.cmdExplainQuery, () => __awaiter(this, void 0, void 0, function* () {
            yield launchEditorChatWithPrompt(Prompts.explainQueryPrompt, Prompts.explainQuerySelectionPrompt);
            (0, telemetry_2.sendActionEvent)(telemetry_1.TelemetryViews.CopilotChat, telemetry_1.TelemetryActions.CopilotExplainCommand);
        })));
        // -- REWRITE QUERY --
        this._context.subscriptions.push(vscode.commands.registerCommand(Constants.cmdRewriteQuery, () => __awaiter(this, void 0, void 0, function* () {
            yield launchEditorChatWithPrompt(Prompts.rewriteQueryPrompt, Prompts.rewriteQuerySelectionPrompt);
            (0, telemetry_2.sendActionEvent)(telemetry_1.TelemetryViews.CopilotChat, telemetry_1.TelemetryActions.CopilotRewriteCommand);
        })));
    }
    registerAgent(context) {
        const pgsqlAgent = vscode.chat.createChatParticipant(CHAT_PARTICIPANT_ID, this.createHandler());
        pgsqlAgent.iconPath = vscode.Uri.joinPath(context.extensionUri, "media", "pgsql-profile-pic.png");
        pgsqlAgent.onDidReceiveFeedback((feedback) => {
            var _a, _b, _c, _d, _e;
            // Capture chat result feedback to be able to compute the success metric of the participant
            const sessionId = (_a = feedback.result.metadata) === null || _a === void 0 ? void 0 : _a.sessionId;
            const chatId = (_b = feedback.result.metadata) === null || _b === void 0 ? void 0 : _b.chatId;
            const isDisconnected = ((_c = feedback.result.metadata) === null || _c === void 0 ? void 0 : _c.isDisconnected) || false;
            (0, telemetry_2.sendActionEvent)(telemetry_1.TelemetryViews.CopilotChat, telemetry_1.TelemetryActions.CopilotSubmitFeedback, {
                kind: feedback.kind === vscode.ChatResultFeedbackKind.Unhelpful
                    ? "unhelpful"
                    : "helpful",
                isError: feedback.result.errorDetails ? "true" : "false",
                errorMessage: (_d = feedback.result.errorDetails) === null || _d === void 0 ? void 0 : _d.message,
                responseIsFiltered: ((_e = feedback.result.errorDetails) === null || _e === void 0 ? void 0 : _e.responseIsFiltered)
                    ? "true"
                    : "false",
                sessionId: sessionId,
                chatId: chatId,
                isDisconnected: isDisconnected ? "true" : "false",
            });
        });
    }
    createHandler() {
        const service = this;
        const client = this._client;
        const connectionManager = this._connectionManager;
        const handler = (request, context, stream, token) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const supportsToolCalling = (_a = request.model.capabilities) === null || _a === void 0 ? void 0 : _a.supportsToolCalling;
            if (supportsToolCalling !== undefined && !supportsToolCalling) {
                stream.markdown(`> ⚠️ ${request.model.id} does not support tool calling, which is required. Please select a different model.`);
                return;
            }
            var connectionFileUri;
            let activeEditorUri;
            let activeEditorSelection;
            const activeEditor = vscode.window.activeTextEditor;
            if (activeEditor) {
                activeEditorUri = activeEditor.document.uri.toString(true);
                connectionFileUri = activeEditorUri;
                if (((_b = activeEditor.selections) === null || _b === void 0 ? void 0 : _b.length) === 1) {
                    // Calculate the selection if we have a selection, otherwise we'll treat null as
                    // the entire document's selection
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
                var isConnected = connectionManager.isConnected(activeEditorUri);
                this._lastActiveConnectionUri = activeEditorUri;
            }
            if (!isConnected) {
                if (this._lastActiveConnectionUri) {
                    isConnected = connectionManager.isConnected(this._lastActiveConnectionUri);
                    if (isConnected) {
                        connectionFileUri = this._lastActiveConnectionUri;
                    }
                }
                if (!isConnected) {
                    (0, telemetry_2.sendActionEvent)(telemetry_1.TelemetryViews.CopilotChat, telemetry_1.TelemetryActions.CopilotChatRequestDisconnected);
                    stream.markdown(`${DISCONNECTED_PREFIX} To interact with the database, open a query editor with an active connection.`);
                    return {
                        metadata: {
                            isDisconnected: true,
                        },
                    };
                }
            }
            const sessionId = this.getSessionId(request, context, request.prompt);
            const conn_info = connectionManager.getConnectionInfo(this._lastActiveConnectionUri);
            const profileName = this.getConnectionName(conn_info.credentials);
            var accessMode = (0, utils_1.toCopilotAccessCode)(conn_info.credentials.copilotAccessMode);
            if (!accessMode) {
                accessMode =
                    (0, utils_1.toCopilotAccessCode)(vscode.workspace
                        .getConfiguration(Constants.configChatSectionName)
                        .get(Constants.configAccessMode)) || messages_2.CopilotAccessMode.ReadWrite;
            }
            var connectionMessage = `${CONNECTED_PREFIX} to __${profileName}__`;
            if (accessMode === messages_2.CopilotAccessMode.ReadOnly) {
                connectionMessage += " _(read-only)_";
            }
            else if (accessMode === messages_2.CopilotAccessMode.ReadWrite) {
                connectionMessage += " _(read/write)_";
            }
            connectionMessage += `\n\n`;
            stream.markdown(connectionMessage);
            // If this is the "Chat with your database" request, return a predefined message.
            // Imitate the behavior of the chat agent.
            if (request.prompt === "Hello!") {
                const msg = "Hi there! How can I assist you with your PostgreSQL database today?";
                //stream.markdown(msg);
                yield (0, utils_1.streamMarkdown)(msg, stream, 30, 6);
                return;
            }
            // Get results context
            let resultSetSummaries = undefined;
            let messages = undefined;
            if (activeEditorUri) {
                const queryResultWebViewController = service._getQueryResultWebViewController();
                if (queryResultWebViewController) {
                    const queryResults = queryResultWebViewController.maybeGetQueryResultState(activeEditorUri);
                    if (queryResults) {
                        resultSetSummaries = Object.values(queryResults.resultSetSummaries)
                            .map((record) => Object.values(record))
                            .flatMap((record) => record);
                        messages = queryResults.messages;
                    }
                }
            }
            // If an accountId is set, this is an Azure database.
            // Fetch an ARM key to use for the request, if needed.
            const accountId = conn_info.credentials.accountId;
            let armToken = undefined;
            if (accountId) {
                const tenantId = conn_info.credentials.tenantId || "";
                const cacheKey = `${accountId}|${tenantId}`;
                armToken = this._armTokenCache.get(cacheKey);
                if (!armToken ||
                    !azureController_1.AzureController.isTokenValid(armToken.token, armToken.expiresOn)) {
                    armToken = yield this._connectionManager.fetchArmToken(conn_info.credentials);
                    if (armToken) {
                        this._armTokenCache.set(cacheKey, armToken);
                    }
                }
            }
            const history = context.history
                .flatMap((turn) => {
                if (isChatRequestTurn(turn)) {
                    // If turn is a ChatRequestTurn, use prompt as content
                    return [
                        {
                            content: turn.prompt,
                            participant: "user",
                        },
                    ];
                }
                else if (isChatResponseTurn(turn)) {
                    // If turn is a ChatResponseTurn,
                    // use only ChatResponseMarkdownPart response elements, concatenated, as content
                    const content = turn.response
                        .filter(isChatResponseMarkdownPart)
                        .map((response) => response.value.value)
                        .join("\n");
                    return this.cleanAssistantHistoryContent(content);
                }
            })
                .filter((turn) => turn !== undefined);
            // Check if the connection has changed
            const prevProfile = this._sessionConnections.get(sessionId || "");
            if (prevProfile && prevProfile !== profileName) {
                history.push({
                    content: `<SYSTEM_MESSAGE>NOTICE: Connection changed to ${profileName}</SYSTEM_MESSAGE>`,
                    participant: "user",
                });
            }
            this._sessionConnections.set(sessionId || "", profileName);
            const requestParams = {
                ownerUri: connectionFileUri,
                profileName: profileName,
                prompt: request.prompt,
                activeEditorUri: activeEditorUri,
                activeEditorSelection: activeEditorSelection,
                resultSetSummaries: resultSetSummaries,
                resultMessages: messages,
                armToken: armToken
                    ? messages_2.AzureToken.createAzureToken(armToken.token, armToken.expiresOn)
                    : undefined,
                sessionId: sessionId,
                accessMode: accessMode,
                history: history,
            };
            const response = yield client.sendRequest(messages_2.ChatCompletionRequest.type, requestParams);
            const telemetryActivity = (0, telemetry_2.startActivity)(telemetry_1.TelemetryViews.CopilotChat, telemetry_1.TelemetryActions.CopilotChatRequest, response.chatId, {
                accessMode: `${accessMode}`,
                sessionId: sessionId,
                chatId: response.chatId,
                hasArmToken: armToken ? "true" : "false",
                historyLength: history.length.toString(),
            });
            const chatInstanceInfo = new ChatInstanceInfo(response.chatId, sessionId, request.model, stream, token);
            service._activeChatInstances.set(response.chatId, chatInstanceInfo);
            var finishInfo = yield chatInstanceInfo.promise;
            if (finishInfo.isError) {
                telemetryActivity.endFailed(new Error(finishInfo.errorMessage), true);
                return {
                    errorDetails: {
                        message: finishInfo.errorMessage,
                        responseIsFiltered: false,
                    },
                    metadata: {
                        chatId: response.chatId,
                        sessionId: sessionId,
                    },
                };
            }
            telemetryActivity.end(telemetry_1.ActivityStatus.Succeeded);
            return {
                metadata: {
                    chatId: response.chatId,
                    sessionId: sessionId,
                },
            };
        });
        return handler;
    }
    getConnectionName(credentials) {
        const db_name = credentials.database;
        const profile_name = credentials.profileName
            ? `${credentials.profileName}/${db_name}`
            : (0, connectionInfo_1.getConnectionShortName)(credentials);
        return profile_name;
    }
    cleanAssistantHistoryContent(content) {
        // For connection messages, separate them into their own history entry.
        // This is to avoid sending the connection message as part of the
        // conversation history, which the model tends to replicate.
        const result = [];
        const cleanedLines = [];
        for (const line of content.split("\n")) {
            if (line.startsWith(CONNECTED_PREFIX) || line.startsWith(DISCONNECTED_PREFIX)) {
                result.push({
                    content: `<SYSTEM_MESSAGE>${line}</SYSTEM_MESSAGE>`,
                    participant: "user",
                });
            }
            else {
                cleanedLines.push(line);
            }
        }
        if (cleanedLines.length > 0) {
            result.push({
                content: cleanedLines.join("\n"),
                participant: "assistant",
            });
        }
        return result;
    }
    handleFunctionCallNotification(progressUpdate) {
        const chatId = progressUpdate.chatId;
        const message = progressUpdate.message;
        const functionArgs = progressUpdate.functionArgs;
        const eventProperties = {
            functionName: progressUpdate.functionName,
            chatId: chatId,
        };
        if (functionArgs) {
            Object.assign(eventProperties, functionArgs);
        }
        (0, telemetry_2.sendActionEvent)(telemetry_1.TelemetryViews.CopilotChat, telemetry_1.TelemetryActions.CopilotFunctionCall, eventProperties);
        if (message && chatId) {
            // Find the active conversation
            const chatInstance = this._activeChatInstances.get(chatId);
            if (!chatInstance) {
                return;
            }
            // Send the content to the chat stream
            const stream = chatInstance.stream;
            stream.progress(message);
        }
    }
    handleCompletionContent(completionContent) {
        // The ChatCompletionResult will be a streaming text response.
        // When the stream is done, the isComplete flag will be set to true.
        const chatId = completionContent.chatId;
        const content = completionContent.content;
        const isComplete = completionContent.isComplete;
        // Find the active conversation
        const chatInstance = this._activeChatInstances.get(chatId);
        if (!chatInstance) {
            return;
        }
        if (completionContent.isError) {
            // If there was an error, send the error message to the chat stream
            var finishInfo = new ChatInstanceFinishInfo();
            finishInfo.isError = true;
            finishInfo.errorMessage = completionContent.errorMessage;
            chatInstance.completeChat(finishInfo);
            this._activeChatInstances.delete(chatId);
            return;
        }
        if (content) {
            // Send the content to the chat stream
            const stream = chatInstance.stream;
            stream.markdown(content);
        }
        if (isComplete) {
            // Resolve the promise to complete the conversation
            chatInstance.completeChat(new ChatInstanceFinishInfo());
            this._activeChatInstances.delete(chatId);
        }
    }
    getSessionId(request, context, prompt) {
        // sessionId is contained in the tool call invocation token;
        // however this is not public API.
        // Fall back to another mechanism if it doesn't exist.
        let sessionId = undefined;
        const toolInvocationToken = request.toolInvocationToken;
        if (toolInvocationToken) {
            if (toolInvocationToken.hasOwnProperty("sessionId")) {
                // @ts-ignore
                sessionId = toolInvocationToken.sessionId;
            }
        }
        if (!sessionId) {
            // If sessionId is not available, use the hash of the first message that is not
            // the generic opening chat as the sessionId.
            for (const turn of context.history) {
                if (isChatRequestTurn(turn)) {
                    if (turn.prompt !== Prompts.genericChatStart) {
                        sessionId = (0, utils_1.hashPrompt)(turn.prompt);
                        break;
                    }
                }
            }
        }
        if (!sessionId) {
            if (prompt !== Prompts.genericChatStart) {
                sessionId = (0, utils_1.hashPrompt)(prompt);
            }
        }
        return sessionId;
    }
}
exports.ChatService = ChatService;
// Type guards
function isChatRequestTurn(turn) {
    return turn.prompt !== undefined;
}
function isChatResponseTurn(turn) {
    return turn.response !== undefined;
}
function isChatResponseMarkdownPart(response) {
    return response.value !== undefined;
}

//# sourceMappingURL=chatService.js.map
