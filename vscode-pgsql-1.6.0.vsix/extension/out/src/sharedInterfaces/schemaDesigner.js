"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionIdContainer = exports.IdentityGeneration = exports.ReplicaIdentity = exports.NodeTypes = void 0;
var NodeTypes;
(function (NodeTypes) {
    NodeTypes["TableSchema"] = "tableSchema";
})(NodeTypes || (exports.NodeTypes = NodeTypes = {}));
var ReplicaIdentity;
(function (ReplicaIdentity) {
    ReplicaIdentity["DEFAULT"] = "DEFAULT";
    ReplicaIdentity["INDEX"] = "INDEX";
    ReplicaIdentity["FULL"] = "FULL";
    ReplicaIdentity["NOTHING"] = "NOTHING";
})(ReplicaIdentity || (exports.ReplicaIdentity = ReplicaIdentity = {}));
var IdentityGeneration;
(function (IdentityGeneration) {
    IdentityGeneration["ALWAYS"] = "ALWAYS";
    IdentityGeneration["BY_DEFAULT"] = "BY DEFAULT";
})(IdentityGeneration || (exports.IdentityGeneration = IdentityGeneration = {}));
class SessionIdContainer {
    constructor(sessionId) {
        this.sessionId = sessionId;
    }
}
exports.SessionIdContainer = SessionIdContainer;

//# sourceMappingURL=schemaDesigner.js.map
