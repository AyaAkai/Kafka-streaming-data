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
exports.BulkLoadCsvTool = exports.BulkLoadCsvToolRequest = void 0;
const vscode = require("vscode");
const tool_1 = require("../tool");
const vscode_languageclient_1 = require("vscode-languageclient");
var BulkLoadCsvToolRequest;
(function (BulkLoadCsvToolRequest) {
    BulkLoadCsvToolRequest.type = new vscode_languageclient_1.RequestType("tools/bulk-load-csv");
})(BulkLoadCsvToolRequest || (exports.BulkLoadCsvToolRequest = BulkLoadCsvToolRequest = {}));
class BulkLoadCsvTool extends tool_1.Tool {
    constructor(client, results) {
        super();
        this.client = client;
        this.results = results;
        this.toolName = "pgsql_bulk_load_csv";
    }
    call(options, _token) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.client.sendRequest(BulkLoadCsvToolRequest.type, options.input);
            const result = yield this.results.waitForResult(response.responseId);
            return JSON.stringify(result);
        });
    }
    prepareInvocation(options, _token) {
        return __awaiter(this, void 0, void 0, function* () {
            const { path } = options.input;
            const filename = path.split(/[\\\/]/).pop();
            const confirmationText = `Bulk Load CSV from path '${path}'?`;
            const confirmationMessages = {
                title: "pgsql: Bulk Load CSV",
                message: new vscode.MarkdownString(confirmationText),
            };
            const invocationMessage = `Bulk Loading CSV from file '${filename}'.`;
            return { invocationMessage, confirmationMessages };
        });
    }
}
exports.BulkLoadCsvTool = BulkLoadCsvTool;

//# sourceMappingURL=bulkLoadCsvTool.js.map
