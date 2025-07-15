"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityStatus = exports.TelemetryActions = exports.TelemetryViews = void 0;
var TelemetryViews;
(function (TelemetryViews) {
    TelemetryViews["ObjectExplorer"] = "ObjectExplorer";
    TelemetryViews["CommandPalette"] = "CommandPalette";
    TelemetryViews["SqlProjects"] = "SqlProjects";
    TelemetryViews["QueryEditor"] = "QueryEditor";
    TelemetryViews["QueryResult"] = "QueryResult";
    TelemetryViews["ResultsGrid"] = "ResultsGrid";
    TelemetryViews["ConnectionPrompt"] = "ConnectionPrompt";
    TelemetryViews["WebviewController"] = "WebviewController";
    TelemetryViews["ObjectExplorerFilter"] = "ObjectExplorerFilter";
    TelemetryViews["TableDesigner"] = "TableDesigner";
    TelemetryViews["UserSurvey"] = "UserSurvey";
    TelemetryViews["General"] = "General";
    TelemetryViews["ConnectionDialog"] = "ConnectionDialog";
    TelemetryViews["CreationHub"] = "CreationHub";
    TelemetryViews["DockerCreate"] = "DockerCreate";
    TelemetryViews["ExecutionPlan"] = "ExecutionPlan";
    TelemetryViews["CopilotChat"] = "CopilotChat";
    TelemetryViews["SchemaDesigner"] = "SchemaDesigner";
    TelemetryViews["ServerGroup"] = "ServerGroup";
    TelemetryViews["PsqlService"] = "PsqlService";
    TelemetryViews["ToolsService"] = "ToolsService";
})(TelemetryViews || (exports.TelemetryViews = TelemetryViews = {}));
var TelemetryActions;
(function (TelemetryActions) {
    TelemetryActions["Activate"] = "Activate";
    TelemetryActions["GenerateScript"] = "GenerateScript";
    TelemetryActions["Refresh"] = "Refresh";
    TelemetryActions["CreateProject"] = "CreateProject";
    TelemetryActions["RemoveConnection"] = "RemoveConnection";
    TelemetryActions["Disconnect"] = "Disconnect";
    TelemetryActions["NewQuery"] = "NewQuery";
    TelemetryActions["RunQuery"] = "RunQuery";
    TelemetryActions["ScriptAsQuery"] = "ScriptAsQuery";
    TelemetryActions["QueryExecutionCompleted"] = "QueryExecutionCompleted";
    TelemetryActions["RunResultPaneAction"] = "RunResultPaneAction";
    TelemetryActions["TestConnection"] = "TestConnection";
    TelemetryActions["CreateConnection"] = "CreateConnection";
    TelemetryActions["ConnectionStringInvalid"] = "ConnectionStringInvalid";
    TelemetryActions["ConnectionStringInput"] = "ConnectionStringInput";
    TelemetryActions["CreateConnectionResult"] = "CreateConnectionResult";
    TelemetryActions["ExpandNode"] = "ExpandNode";
    TelemetryActions["ResultPaneAction"] = "ResultPaneAction";
    TelemetryActions["Load"] = "Load";
    TelemetryActions["WebviewRequest"] = "WebviewRequest";
    TelemetryActions["Open"] = "Open";
    TelemetryActions["Submit"] = "Submit";
    TelemetryActions["Cancel"] = "Cancel";
    TelemetryActions["Initialize"] = "Initialize";
    TelemetryActions["Edit"] = "Edit";
    TelemetryActions["Publish"] = "Publish";
    TelemetryActions["ContinueEditing"] = "ContinueEditing";
    TelemetryActions["Close"] = "Close";
    TelemetryActions["SurveySubmit"] = "SurveySubmit";
    TelemetryActions["SaveResults"] = "SaveResults";
    TelemetryActions["CopyResults"] = "CopyResults";
    TelemetryActions["CopyResultsHeaders"] = "CopyResultsHeaders";
    TelemetryActions["CopyHeaders"] = "CopyHeaders";
    TelemetryActions["EnableRichExperiencesPrompt"] = "EnableRichExperiencesPrompt";
    TelemetryActions["OpenQueryResultsInTabByDefaultPrompt"] = "OpenQueryResultsInTabByDefaultPrompt";
    TelemetryActions["OpenQueryResult"] = "OpenQueryResult";
    TelemetryActions["Restore"] = "Restore";
    TelemetryActions["LoadConnection"] = "LoadConnection";
    TelemetryActions["LoadAzureServers"] = "LoadAzureServers";
    TelemetryActions["fetchAzureDatabases"] = "fetchAzureDatabases";
    TelemetryActions["LoadConnectionProperties"] = "LoadConnectionProperties";
    TelemetryActions["LoadRecentConnections"] = "LoadRecentConnections";
    TelemetryActions["LoadAzureSubscriptions"] = "LoadAzureSubscriptions";
    TelemetryActions["OpenExecutionPlan"] = "OpenExecutionPlan";
    TelemetryActions["LoadAzureAccountsForEntraAuth"] = "LoadAzureAccountsForEntraAuth";
    TelemetryActions["LoadAzureTenantsForEntraAuth"] = "LoadAzureTenantsForEntraAuth";
    TelemetryActions["LoadConnections"] = "LoadConnections";
    TelemetryActions["DockerCreate"] = "DockerCreate";
    TelemetryActions["DockerConnect"] = "DockerConnect";
    TelemetryActions["DockerRuntimeMissing"] = "DockerRuntimeMissing";
    TelemetryActions["DockerServiceDown"] = "DockerServiceDown";
    TelemetryActions["AddFirewallRule"] = "AddFirewallRule";
    TelemetryActions["SubmitGithubIssue"] = "SubmitGithubIssue";
    TelemetryActions["AutoColumnSize"] = "AutoColumnSize";
    TelemetryActions["DisableLanguageServiceForNonTSqlFiles"] = "DisableLanguageServiceForNonTSqlFiles";
    TelemetryActions["PsqlTerminal"] = "PsqlTerminal";
    TelemetryActions["CopilotChatRequest"] = "CopilotChatRequest";
    TelemetryActions["CopilotChatRequestDisconnected"] = "CopilotChatRequestDisconnected";
    TelemetryActions["CopilotSubmitFeedback"] = "CopilotSubmitFeedback";
    TelemetryActions["CopilotExplainCommand"] = "CopilotExplainCommand";
    TelemetryActions["CopilotRewriteCommand"] = "CopilotRewriteCommand";
    TelemetryActions["CopilotAnalyzeCommand"] = "CopilotAnalyzeCommand";
    TelemetryActions["CopilotChatWithDatabase"] = "CopilotChatWithDatabase";
    TelemetryActions["CopilotConnectDatabaseInAgentMode"] = "CopilotConnectDatabaseInAgentMode";
    TelemetryActions["CopilotChatWithQuery"] = "CopilotChatWithQuery";
    TelemetryActions["CopilotFunctionCall"] = "CopilotFunctionCall";
    TelemetryActions["CopilotFunctionCallError"] = "CopilotFunctionCallError";
    TelemetryActions["CopilotCompletion"] = "CopilotCompletion";
    TelemetryActions["CopilotAgentModeToolCall"] = "CopilotAgentModeToolCall";
    TelemetryActions["UriHandler"] = "UriHandler";
    TelemetryActions["ServerGroupDialogCancel"] = "ServerGroupDialogCancel";
    TelemetryActions["ServerGroupDialogSubmit"] = "ServerGroupDialogSubmit";
    TelemetryActions["SchemaDesignerCreateSession"] = "SchemaDesignerCreateSession";
    TelemetryActions["SchemaDesignerCloseSession"] = "SchemaDesignerCloseSession";
    TelemetryActions["SchemaDesignerGetSchemaModel"] = "SchemaDesignerGetSchemaModel";
    TelemetryActions["RevealNode"] = "RevealNode";
})(TelemetryActions || (exports.TelemetryActions = TelemetryActions = {}));
/**
 * The status of an activity
 */
var ActivityStatus;
(function (ActivityStatus) {
    ActivityStatus["Succeeded"] = "Succeeded";
    ActivityStatus["Pending"] = "Pending";
    ActivityStatus["Failed"] = "Failed";
    ActivityStatus["Canceled"] = "Canceled";
})(ActivityStatus || (exports.ActivityStatus = ActivityStatus = {}));

//# sourceMappingURL=telemetry.js.map
