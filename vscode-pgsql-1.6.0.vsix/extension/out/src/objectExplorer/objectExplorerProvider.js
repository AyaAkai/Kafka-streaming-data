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
exports.ObjectExplorerProvider = void 0;
const vscode = require("vscode");
const objectExplorerService_1 = require("./objectExplorerService");
const vscodeWrapper_1 = require("../controllers/vscodeWrapper");
const serverFilterManager_1 = require("./serverFilterManager");
const ConnectedFilter_1 = require("./serverFilters/ConnectedFilter");
class ObjectExplorerProvider {
    constructor(_vscodeWrapper, _connectionManager) {
        this._vscodeWrapper = _vscodeWrapper;
        this._connectionManager = _connectionManager;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        if (!_vscodeWrapper) {
            this._vscodeWrapper = new vscodeWrapper_1.default();
        }
        this._objectExplorerService = new objectExplorerService_1.ObjectExplorerService(this._vscodeWrapper, this._connectionManager, this);
        // Initialize filter manager and register default filters
        this._serverFilterManager = new serverFilterManager_1.ServerFilterManager();
        const onlyConnectedFilter = new ConnectedFilter_1.OnlyConnectedServerFilter();
        this._serverFilterManager.registerFilter(onlyConnectedFilter);
    }
    getParent(element) {
        return element.parentNode;
    }
    /**
     * Refresh the tree data
     * @param nodeInfo The node to refresh
     * @param cleanNodeChildren should the children of the node be cleared prior to refresh (hard refresh)
     */
    refresh(nodeInfo, cleanNodeChildren = false) {
        if (cleanNodeChildren) {
            this._objectExplorerService.cleanNodeChildren(nodeInfo);
        }
        this._onDidChangeTreeData.fire(nodeInfo);
    }
    getTreeItem(node) {
        return node;
    }
    getChildren(element) {
        return __awaiter(this, void 0, void 0, function* () {
            let children = yield this._objectExplorerService.getChildren(element);
            const isRoot = !element && children;
            if (isRoot) {
                // Only apply filters at the root level (server groups)
                children = this._serverFilterManager.applyFilters(children);
            }
            return children || [];
        });
    }
    createSession(promise, connectionCredentials, context) {
        return __awaiter(this, void 0, void 0, function* () {
            return this._objectExplorerService.createSession(promise, connectionCredentials, context);
        });
    }
    expandNode(node, sessionId, promise) {
        return __awaiter(this, void 0, void 0, function* () {
            return this._objectExplorerService.expandNode(node, sessionId, promise);
        });
    }
    getConnectionCredentials(sessionId) {
        if (sessionId) {
            return this._objectExplorerService.getConnectionCredentials(sessionId);
        }
        return undefined;
    }
    /**
     * Update the mapping for sessionID -> ConnectionInfo. These may be updated
     * after an Entra ID token refresh
     * @param sessionId The session ID to update
     * @param connectionCredentials The new connection credentials to set
     */
    updateConnectionCredentials(sessionId, connectionCredentials) {
        this._objectExplorerService.updateConnectionCredentials(sessionId, connectionCredentials);
    }
    /**
     * Updates in place the azureAccountToken, expiresOn, and password of the
     * connectionInfo for the node with the canonical version from the
     * sessionIdToConnectionProfileMap.
     */
    syncConnectionAuthFields(node) {
        this._objectExplorerService.syncConnectionAuthFields(node);
    }
    removeObjectExplorerNode(node_1) {
        return __awaiter(this, arguments, void 0, function* (node, isDisconnect = false) {
            return this._objectExplorerService.removeObjectExplorerNode(node, isDisconnect);
        });
    }
    refreshNode(node) {
        return __awaiter(this, void 0, void 0, function* () {
            return this._objectExplorerService.refreshNode(node);
        });
    }
    signInNodeServer(node) {
        this._objectExplorerService.signInNodeServer(node);
    }
    updateNode(node) {
        this._objectExplorerService.updateNode(node);
    }
    removeConnectionNodes(connections) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._objectExplorerService.removeConnectionNodes(connections);
        });
    }
    addDisconnectedNode(connectionCredentials) {
        this._objectExplorerService.addDisconnectedNode(connectionCredentials);
    }
    addServerGroupNode(group) {
        this._objectExplorerService.addServerGroupNode(group);
    }
    moveServerNode(serverNode, previousParentId, targetParentId) {
        return __awaiter(this, void 0, void 0, function* () {
            const rootGroups = this.objectExplorerService.rootTreeNodeArray;
            const previousParent = rootGroups.find((node) => node.id === previousParentId);
            const targetParent = rootGroups.find((node) => node.id === targetParentId);
            if (!targetParent) {
                return;
            }
            if (previousParent) {
                previousParent.removeChild(serverNode);
            }
            targetParent.addChild(serverNode);
            // Update the connection profile with the new group ID in the settings file
            serverNode.updateConnectionInfo(Object.assign(Object.assign({}, serverNode.connectionInfo), { groupId: targetParent.id }));
            const updatedConnProfile = serverNode.connectionInfo;
            const connConfig = this._connectionManager.connectionStore
                .connectionConfig;
            yield connConfig.updateConnection(updatedConnProfile);
            // Refresh entire tree to apply any filters correctly
            this.refresh(undefined);
        });
    }
    /** Getters */
    get currentNode() {
        return this._objectExplorerService.currentNode;
    }
    get objectExplorerExists() {
        return this._objectExplorerExists;
    }
    get nodeConnections() {
        return this._objectExplorerService.nodeConnections;
    }
    /** Setters */
    set objectExplorerExists(value) {
        this._objectExplorerExists = value;
    }
    set objectExplorerService(value) {
        this._objectExplorerService = value;
    }
    get objectExplorerService() {
        return this._objectExplorerService;
    }
    set currentNode(node) {
        this._objectExplorerService.currentNode = node;
    }
    // --- Filter control API ---
    /**
     * Registers the commands for the server filter manager's filters.
     */
    registerFilterCommands(context) {
        this._serverFilterManager.registerCommands(context, this);
    }
}
exports.ObjectExplorerProvider = ObjectExplorerProvider;

//# sourceMappingURL=objectExplorerProvider.js.map
