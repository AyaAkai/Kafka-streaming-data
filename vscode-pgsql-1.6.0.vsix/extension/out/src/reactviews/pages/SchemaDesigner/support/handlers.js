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
exports.reactFlowHandler = void 0;
const reactFlowInstance_1 = require("./reactFlowInstance");
const dagreLayout_1 = require("./dagreLayout");
class reactFlowHandler {
    constructor(_setEdgesCb, _setNodesCb, _flowEdgeCb, _flowNodeCb) {
        this._setEdgesCb = _setEdgesCb;
        this._setNodesCb = _setNodesCb;
        this._flowEdgeCb = _flowEdgeCb;
        this._flowNodeCb = _flowNodeCb;
    }
    handleEdgeChanges(changes) {
        return __awaiter(this, void 0, void 0, function* () {
            //this._context.handleEdgeChanges(changes);
            this._flowEdgeCb(changes);
        });
    }
    handleNodeChanges(changes) {
        return __awaiter(this, void 0, void 0, function* () {
            //this._context.handleNodeChanges(changes);
            this._flowNodeCb(changes);
        });
    }
    autoLayoutNodes() {
        return __awaiter(this, arguments, void 0, function* (fitView = true) {
            var _a, _b, _c;
            const nodes = (_a = reactFlowInstance_1.ReactFlowHandle.instance) === null || _a === void 0 ? void 0 : _a.getNodes();
            const edges = (_b = reactFlowInstance_1.ReactFlowHandle.instance) === null || _b === void 0 ? void 0 : _b.getEdges();
            const [new_nodes, new_edges] = (0, dagreLayout_1.layoutDagreTree)(nodes, edges);
            this._setNodesCb(new_nodes);
            this._setEdgesCb(new_edges);
            if (fitView) {
                yield ((_c = reactFlowInstance_1.ReactFlowHandle.instance) === null || _c === void 0 ? void 0 : _c.fitView({
                    nodes: new_nodes.map((node) => {
                        return { id: node.id };
                    }),
                }));
            }
        });
    }
}
exports.reactFlowHandler = reactFlowHandler;

//# sourceMappingURL=handlers.js.map
