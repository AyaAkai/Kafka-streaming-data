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
exports.VisualizeSchemaTool = void 0;
const vscode = require("vscode");
const tool_1 = require("../tool");
class VisualizeSchemaTool extends tool_1.Tool {
    constructor(connectionManager, schemaDesignerService) {
        super();
        this.connectionManager = connectionManager;
        this.schemaDesignerService = schemaDesignerService;
        this.toolName = "pgsql_visualize_schema";
        this.description = "Visualize the schema for a PostgreSQL connection.";
    }
    call(options, _token) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const { connectionId } = options.input;
            try {
                const connInfo = (_a = this.connectionManager.getConnectionInfo(connectionId)) === null || _a === void 0 ? void 0 : _a.credentials;
                if (!connInfo) {
                    return JSON.stringify({
                        success: false,
                        message: `No connection found for connectionId: ${connectionId}`,
                    });
                }
                // Cast to concrete type to access the method
                yield this.schemaDesignerService.createSchemaWebviewSession(connInfo);
                return JSON.stringify({
                    success: true,
                    message: "Schema visualization opened.",
                });
            }
            catch (err) {
                return JSON.stringify({
                    success: false,
                    message: err instanceof Error ? err.message : String(err),
                });
            }
        });
    }
    prepareInvocation(options, _token) {
        return __awaiter(this, void 0, void 0, function* () {
            const { connectionId } = options.input;
            return {
                invocationMessage: `Visualizing schema for connection '${connectionId}'`,
                confirmationMessages: {
                    title: "pgsql: Visualize Schema",
                    message: new vscode.MarkdownString(`Visualize schema for connection '${connectionId}'?`),
                },
            };
        });
    }
}
exports.VisualizeSchemaTool = VisualizeSchemaTool;

//# sourceMappingURL=visualizeSchemaTool.js.map
