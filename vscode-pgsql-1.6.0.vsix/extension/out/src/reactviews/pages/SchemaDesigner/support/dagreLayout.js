"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.layoutDagreTree = layoutDagreTree;
const dagre_1 = require("@dagrejs/dagre");
const react_1 = require("@xyflow/react");
function layoutDagreTree(nodes, edges, spacing = { x: 100, y: 100 }) {
    const dagreGraph = new dagre_1.default.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({
        nodesep: spacing.y,
        ranksep: spacing.x,
        ranker: "tight-tree",
        rankdir: "LR",
    });
    const subWorkflowRootNodes = [];
    nodes.forEach((node) => {
        const incomers = (0, react_1.getIncomers)(node, nodes, edges);
        if (incomers.length < 1) {
            // Node without input is the root node of sub-workflow
            subWorkflowRootNodes.push(node);
        }
        dagreGraph.setNode(node.id, {
            width: node.measured.width,
            height: node.measured.height,
        });
    });
    edges.forEach((edge) => dagreGraph.setEdge(edge.source, edge.target));
    // Connect sub-workflows' root nodes to the rootNode
    dagreGraph.setNode("#root", { width: 1, height: 1 });
    for (const subWorkflowRootNode of subWorkflowRootNodes) {
        dagreGraph.setEdge("#root", subWorkflowRootNode.id);
    }
    dagre_1.default.layout(dagreGraph);
    return [
        nodes.map((node) => {
            const position = dagreGraph.node(node.id);
            node.position.x = position.x - node.measured.width / 2;
            node.position.y = position.y - node.measured.height / 2;
            return node;
        }),
        edges,
    ];
}

//# sourceMappingURL=dagreLayout.js.map
