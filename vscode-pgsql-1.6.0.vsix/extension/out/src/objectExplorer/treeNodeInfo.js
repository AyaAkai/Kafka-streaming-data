"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerGroupNodeInfo = exports.TreeNodeInfo = void 0;
exports.mergeConnectionAuthFields = mergeConnectionAuthFields;
const vscode = require("vscode");
const objectExplorerUtils_1 = require("./objectExplorerUtils");
const Constants = require("../constants/constants");
class TreeNodeInfo extends vscode.TreeItem {
    constructor(label, context, collapsibleState, nodePath, nodeStatus, nodeType, sessionId, connectionInfo, parentNode, filterProperties, objectMetadata, filters) {
        super(label, collapsibleState);
        this._originalLabel = label;
        this.context = context;
        this._nodePath = nodePath;
        this._nodeStatus = nodeStatus;
        this._nodeType = nodeType;
        this._sessionId = sessionId;
        this._parentNode = parentNode;
        this._connectionInfo = connectionInfo;
        this._filterableProperties = filterProperties;
        this._metadata = objectMetadata;
        this._filters = filters;
        this.iconPath = objectExplorerUtils_1.ObjectExplorerUtils.iconPath(this.nodeType);
    }
    static fromNodeInfo(nodeInfo, sessionId, parentNode, connectionInfo, label, nodeType) {
        var _a;
        let type = nodeType ? nodeType : nodeInfo.nodeType;
        const treeNodeInfo = new TreeNodeInfo(label ? label : nodeInfo.label, {
            type: type,
            filterable: ((_a = nodeInfo.filterableProperties) === null || _a === void 0 ? void 0 : _a.length) > 0,
            hasFilters: false,
            subType: nodeInfo.objectType,
        }, nodeInfo.isLeaf
            ? vscode.TreeItemCollapsibleState.None
            : type === Constants.serverLabel
                ? vscode.TreeItemCollapsibleState.Expanded
                : vscode.TreeItemCollapsibleState.Collapsed, nodeInfo.nodePath, nodeInfo.nodeStatus, type, sessionId, connectionInfo, parentNode, nodeInfo.filterableProperties, nodeInfo.metadata);
        return treeNodeInfo;
    }
    /** Getters */
    get nodePath() {
        return this._nodePath;
    }
    get nodeStatus() {
        return this._nodeStatus;
    }
    get nodeType() {
        return this._nodeType;
    }
    get sessionId() {
        return this._sessionId;
    }
    get nodeSubType() {
        return this._nodeSubType;
    }
    get isLeaf() {
        return this._isLeaf;
    }
    get errorMessage() {
        return this._errorMessage;
    }
    get parentNode() {
        return this._parentNode;
    }
    /**
     * Returns a **copy** of the node's connection information.
     *
     * ⚠️ Note: This is a **shallow copy**—modifying the returned object will NOT affect the original connection info.
     * If you want to update the actual connection info stored in the node, use the `updateConnectionInfo` method instead.
     */
    get connectionInfo() {
        if (!this._connectionInfo) {
            return undefined;
        }
        return Object.assign({}, this._connectionInfo);
    }
    get metadata() {
        return this._metadata;
    }
    get filterableProperties() {
        return this._filterableProperties;
    }
    get context() {
        return this._convertToTreeNodeContext(this.contextValue);
    }
    get filters() {
        return this._filters;
    }
    /** Setters */
    set nodePath(value) {
        this._nodePath = value;
    }
    set nodeStatus(value) {
        this._nodeStatus = value;
    }
    set nodeType(value) {
        this._nodeType = value;
        this._updateContextValue();
    }
    set nodeSubType(value) {
        this._nodeSubType = value;
    }
    set isLeaf(value) {
        this._isLeaf = value;
    }
    set errorMessage(value) {
        this._errorMessage = value;
    }
    set sessionId(value) {
        this._sessionId = value;
    }
    set parentNode(value) {
        this._parentNode = value;
    }
    set filterableProperties(value) {
        this._filterableProperties = value;
        this._updateContextValue();
    }
    set filters(value) {
        this._filters = value;
        this._updateContextValue();
        this.label =
            value.length > 0
                ? vscode.l10n.t("{0} (filtered)", this._originalLabel)
                : this._originalLabel;
    }
    set context(value) {
        this.contextValue = this._convertToContextValue(value);
    }
    updateConnectionInfo(value) {
        this._connectionInfo = value;
    }
    _updateContextValue() {
        var _a, _b;
        const contextValue = this.context;
        contextValue.filterable = ((_a = this.filterableProperties) === null || _a === void 0 ? void 0 : _a.length) > 0;
        contextValue.hasFilters = ((_b = this.filters) === null || _b === void 0 ? void 0 : _b.length) > 0;
        this.context = contextValue;
    }
    //split the context value with, and is in the form of key=value and convert it to TreeNodeContextValue
    _convertToTreeNodeContext(contextValue) {
        let contextArray = contextValue.split(",");
        let context = {
            filterable: false,
            hasFilters: false,
            type: undefined,
            subType: undefined,
        };
        contextArray.forEach((element) => {
            let keyValuePair = element.split("=");
            context[keyValuePair[0]] = keyValuePair[1];
        });
        return context;
    }
    //convert TreeNodeContextValue to context value string
    _convertToContextValue(context) {
        if (context === undefined) {
            return "";
        }
        let contextValue = "";
        Object.keys(context).forEach((key) => {
            contextValue += key + "=" + context[key] + ",";
        });
        return contextValue;
    }
}
exports.TreeNodeInfo = TreeNodeInfo;
/**
 * Utility to merge only authentication-related fields from canonical to local connectionInfo.
 * Only azureAccountToken, expiresOn, and password are updated if present in canonical.
 * Returns a new shallow copy with merged fields.
 */
function mergeConnectionAuthFields(local, canonical) {
    if (!canonical) {
        return Object.assign({}, local);
    }
    const merged = Object.assign({}, local);
    if (canonical.azureAccountToken && canonical.azureAccountToken !== local.azureAccountToken) {
        merged.azureAccountToken = canonical.azureAccountToken;
    }
    if (canonical.expiresOn && canonical.expiresOn !== local.expiresOn) {
        merged.expiresOn = canonical.expiresOn;
    }
    if (canonical.password && canonical.password !== local.password) {
        merged.password = canonical.password;
    }
    return merged;
}
/**
 * Represents a server group node in the Object Explorer.
 * This class extends the TreeNodeInfo class and adds functionality specific to server groups.
 * It contains a list of child nodes and methods to manage them.
 */
class ServerGroupNodeInfo extends TreeNodeInfo {
    constructor(id, label, contextValue, collapsibleState, nodePath, nodeStatus, nodeType, sessionId, connectionInfo, parentNode, filterProperties, objectMetadata, filters) {
        super(label, contextValue, collapsibleState, nodePath, nodeStatus, nodeType, sessionId, connectionInfo, parentNode, filterProperties, objectMetadata, filters);
        this.children = [];
        this.id = id;
    }
    /**
     * Adds a child node to the server group.
     * @param child The child node to add.
     */
    addChild(child) {
        // Insert alphabetically based on label
        const index = this.children.findIndex((c) => c.label.toString().localeCompare(child.label.toString()) > 0);
        if (index === -1) {
            this.children.push(child);
            return;
        }
        this.children.splice(index, 0, child);
    }
    /**
     * Removes a child node from the server group.
     * @param child The child node to remove.
     */
    removeChild(child) {
        const index = this.children.indexOf(child);
        if (index > -1) {
            this.children.splice(index, 1);
        }
    }
}
exports.ServerGroupNodeInfo = ServerGroupNodeInfo;

//# sourceMappingURL=treeNodeInfo.js.map
