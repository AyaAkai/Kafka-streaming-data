"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.TriggerSchemaRefresh = exports.TriggerSchemaRefreshParams = exports.CloseSessionRequest = exports.GetSchemaModelComplete = exports.GetSchemaModelRequest = exports.GetSchemaModelResponse = exports.CreateSessionCompleteNotification = exports.CreateSessionRequest = void 0;
const vscode_languageclient_1 = require("vscode-languageclient");
var CreateSessionRequest;
(function (CreateSessionRequest) {
    CreateSessionRequest.type = new vscode_languageclient_1.RequestType("schemaDesigner/createSession");
})(CreateSessionRequest || (exports.CreateSessionRequest = CreateSessionRequest = {}));
var CreateSessionCompleteNotification;
(function (CreateSessionCompleteNotification) {
    CreateSessionCompleteNotification.type = new vscode_languageclient_1.NotificationType("schemaDesigner/sessionCreated");
})(CreateSessionCompleteNotification || (exports.CreateSessionCompleteNotification = CreateSessionCompleteNotification = {}));
class GetSchemaModelResponse {
}
exports.GetSchemaModelResponse = GetSchemaModelResponse;
var GetSchemaModelRequest;
(function (GetSchemaModelRequest) {
    GetSchemaModelRequest.type = new vscode_languageclient_1.RequestType("schemaDesigner/getSchemaModel");
})(GetSchemaModelRequest || (exports.GetSchemaModelRequest = GetSchemaModelRequest = {}));
var GetSchemaModelComplete;
(function (GetSchemaModelComplete) {
    GetSchemaModelComplete.type = new vscode_languageclient_1.NotificationType("schemaDesigner/getSchemaModelComplete");
})(GetSchemaModelComplete || (exports.GetSchemaModelComplete = GetSchemaModelComplete = {}));
var CloseSessionRequest;
(function (CloseSessionRequest) {
    CloseSessionRequest.type = new vscode_languageclient_1.RequestType("schemaDesigner/closeSession");
})(CloseSessionRequest || (exports.CloseSessionRequest = CloseSessionRequest = {}));
class TriggerSchemaRefreshParams {
}
exports.TriggerSchemaRefreshParams = TriggerSchemaRefreshParams;
var TriggerSchemaRefresh;
(function (TriggerSchemaRefresh) {
    TriggerSchemaRefresh.type = new vscode_languageclient_1.NotificationType("schemaDesigner/triggerSchemaRefresh");
})(TriggerSchemaRefresh || (exports.TriggerSchemaRefresh = TriggerSchemaRefresh = {}));

//# sourceMappingURL=schemaDesigner.js.map
