"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolService = void 0;
const vscode = require("vscode");
const logger_1 = require("../../../models/logger");
const listServersTool_1 = require("./connect/listServersTool");
const connectTool_1 = require("./connect/connectTool");
const queryTool_1 = require("./query/queryTool");
const modifyTool_1 = require("./query/modifyTool");
const getDatabaseObjectsTool_1 = require("./schema/getDatabaseObjectsTool");
const listDatabasesTool_1 = require("./connect/listDatabasesTool");
const visualizeSchemaTool_1 = require("./schema/visualizeSchemaTool");
const describeCsvTool_1 = require("./load/describeCsvTool");
const untitledSqlDocumentService_1 = require("../../../controllers/untitledSqlDocumentService");
const openScriptTool_1 = require("./query/openScriptTool");
const bulkLoadCsvTool_1 = require("./load/bulkLoadCsvTool");
// import { PgsqlAgentTool } from "./agent/pgsqlAgentTool";
const toolResultHandler_1 = require("./toolResultHandler");
const disconnectTool_1 = require("./connect/disconnectTool");
class ToolService {
    constructor(_client, _vscodeWrapper, _connectionManager, _schemaDesignerService) {
        this._client = _client;
        this._vscodeWrapper = _vscodeWrapper;
        this._connectionManager = _connectionManager;
        this._schemaDesignerService = _schemaDesignerService;
        // store both resolve and reject handlers for each pending response
        this._pending = new Map();
        this._logger = logger_1.Logger.create(this._vscodeWrapper.outputChannel, "ToolsService");
        this._untitledDocService = new untitledSqlDocumentService_1.default(this._vscodeWrapper);
        this._client.onNotification(toolResultHandler_1.ToolResultNotification.type, this.onToolResult.bind(this));
    }
    waitForResult(responseId) {
        return new Promise((resolve, reject) => {
            this._pending.set(responseId, { resolve, reject });
        });
    }
    onToolResult(payload) {
        const entry = this._pending.get(payload.responseId);
        if (!entry) {
            return;
        }
        this._pending.delete(payload.responseId);
        if (payload.error) {
            entry.reject(new Error(payload.error));
        }
        else {
            entry.resolve(payload.result);
        }
    }
    registerTools(context) {
        this._logger.info("ToolsService: registerTools called");
        const tools = [
            // vscode-pgsql implemented tools
            new listServersTool_1.ListServersTool(this._connectionManager),
            new connectTool_1.ConnectTool(this._connectionManager),
            new disconnectTool_1.DisconnectTool(this._connectionManager),
            new openScriptTool_1.OpenScriptTool(this._connectionManager, this._untitledDocService),
            new visualizeSchemaTool_1.VisualizeSchemaTool(this._connectionManager, this._schemaDesignerService),
            // pgsql-tools implemented tools
            new queryTool_1.QueryTool(this._client, this),
            new modifyTool_1.ModifyTool(this._client, this),
            new getDatabaseObjectsTool_1.GetDatabaseObjectsTool(this._client, this),
            new listDatabasesTool_1.ListDatabasesTool(this._client, this),
            new describeCsvTool_1.DescribeCsvTool(this._client, this),
            new bulkLoadCsvTool_1.BulkLoadCsvTool(this._client, this),
            // Removing for now
            // new PgsqlAgentTool(this._client, this),
        ];
        tools.forEach((tool) => {
            this._logger.info(`Registering tool: ${tool.toolName}`);
            context.subscriptions.push(vscode.lm.registerTool(tool.toolName, tool));
        });
    }
}
exports.ToolService = ToolService;

//# sourceMappingURL=toolService.js.map
