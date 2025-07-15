"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObjectExplorerDragAndDropController = void 0;
const vscode = require("vscode");
const treeNodeInfo_1 = require("./treeNodeInfo");
const constants_1 = require("../constants/constants");
const customServerMimeType = "application/vnd.code.tree.pgobjectexplorer.servernode";
const mimeTypes = [
    "text/plain",
    "application/vnd.code.tree.pg-objectexplorer",
    customServerMimeType,
];
class ObjectExplorerDragAndDropController {
    constructor(_objectExplorerProvider) {
        this._objectExplorerProvider = _objectExplorerProvider;
        this.dropMimeTypes = mimeTypes;
        this.dragMimeTypes = mimeTypes;
    }
    handleDrag(source, dataTransfer, _) {
        const item = source[0]; // Handle only the first item for simplicity
        if (item instanceof treeNodeInfo_1.TreeNodeInfo === false) {
            return;
        }
        if (item.nodeType === constants_1.serverNodeType || item.nodeType === constants_1.disconnectedServerNodeType) {
            dataTransfer.set(customServerMimeType, new vscode.DataTransferItem(item));
        }
        else if (item.metadata) {
            let objectString = "";
            switch (item.metadata.metadataTypeName) {
                case "Table":
                case "StoredProcedure":
                case "View":
                case "UserDefinedFunction":
                    objectString = `${item.metadata.schema}.${item.metadata.name}`;
                    break;
                default:
                    objectString = item.metadata.name || "";
                    break;
            }
            dataTransfer.set("text/plain", new vscode.DataTransferItem(objectString));
        }
        else {
            console.log("Source was not draggable");
            return;
        }
    }
    handleDrop(targetServerGroup, dataTransfer, _) {
        if (!targetServerGroup || !(targetServerGroup instanceof treeNodeInfo_1.ServerGroupNodeInfo)) {
            return;
        }
        const draggedData = dataTransfer.get(customServerMimeType);
        if (!draggedData) {
            return;
        }
        const serverNode = draggedData.value;
        if (!serverNode) {
            return;
        }
        const previousParentId = serverNode.connectionInfo.groupId;
        // Dragged to the same parent
        if (previousParentId === targetServerGroup.id) {
            return;
        }
        void this._objectExplorerProvider.moveServerNode(serverNode, previousParentId, targetServerGroup.id);
    }
}
exports.ObjectExplorerDragAndDropController = ObjectExplorerDragAndDropController;

//# sourceMappingURL=objectExplorerDragAndDropController.js.map
