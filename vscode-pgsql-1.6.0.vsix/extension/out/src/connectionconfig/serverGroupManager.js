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
exports.ServerGroupManager = void 0;
const vscode = require("vscode");
const vscodeWrapper_1 = require("../controllers/vscodeWrapper");
const Constants = require("../constants/constants");
const Utils = require("../models/utils");
const logger_1 = require("../models/logger");
const locConstants_1 = require("../constants/locConstants");
const serverGroupWebviewController_1 = require("../serverGroups/serverGroupWebviewController");
const defaultGroupName = locConstants_1.ServerGroups.defaultGroupName;
/**
 * Manages server groups, providing access for reading and writing connection groups.
 */
class ServerGroupManager {
    constructor(vscodeWrapper, logger) {
        this._vscodeWrapper = vscodeWrapper;
        this._logger = logger;
    }
    static getInstance(vscodeWrapper, logger) {
        if (!ServerGroupManager._instance) {
            const _vscode = vscodeWrapper || new vscodeWrapper_1.default();
            const _log = logger || logger_1.Logger.create(_vscode.outputChannel, "ServerGroupManager");
            ServerGroupManager._instance = new ServerGroupManager(_vscode, _log);
        }
        return ServerGroupManager._instance;
    }
    /**
     * Registers commands for server group management.
     * @param context The extension context.
     * @param vscodeWrapper The VS Code wrapper.
     * @param objectExplorerProvider The object explorer provider.
     * @param connectionStore The connection store.
     */
    registerCommands(context, vscodeWrapper, objectExplorerProvider, connectionStore) {
        // register edit server group command
        vscode.commands.registerCommand(Constants.cmdEditServerGroup, (groupNode) => {
            if (!groupNode) {
                return;
            }
            this.handleEditServerGroup(groupNode, context, vscodeWrapper, objectExplorerProvider);
        });
        // register create server group command
        vscode.commands.registerCommand(Constants.cmdCreateServerGroup, () => {
            this.handleCreateServerGroup(context, vscodeWrapper, objectExplorerProvider);
        });
        // register delete server group command
        vscode.commands.registerCommand(Constants.cmdDeleteServerGroup, (groupNode) => __awaiter(this, void 0, void 0, function* () {
            if (!groupNode) {
                return;
            }
            yield this.handleDeleteServerGroup(groupNode, objectExplorerProvider, connectionStore);
        }));
    }
    /**
     * Retrieves all connection groups from the settings.
     * @param global When `true`, retrieves global settings; otherwise, workspace settings.
     */
    getGroups(global = true) {
        const configuration = this._vscodeWrapper.getConfiguration(Constants.extensionName);
        const configValue = configuration.inspect(Constants.serverGroupsArrayName);
        if (global) {
            return configValue.globalValue || [];
        }
        else {
            return (configValue.workspaceValue || []).concat(configValue.workspaceFolderValue || []);
        }
    }
    /**
     * Retrieves a connection group by its ID.
     * @param id The ID of the connection group to retrieve.
     * @returns The connection group with the specified ID, or `undefined` if not found.
     */
    getGroupById(id, global = true) {
        const connGroups = this.getGroups(global);
        return connGroups.find((g) => g.id === id);
    }
    /**
     * Ensure that a default group exists, creating one if necessary.
     * @returns The default connection group.
     */
    getDefaultGroup() {
        return __awaiter(this, void 0, void 0, function* () {
            const groups = this.getGroups();
            // Create a group if none exist
            if (groups.length === 0) {
                const existingNames = new Set(groups.map((g) => g.name));
                const newGroupName = ServerGroupManager.generateUniqueGroupName(defaultGroupName, existingNames);
                const newDefaultGroup = {
                    name: newGroupName,
                    id: Utils.generateGuid(),
                    isDefault: true,
                };
                yield this.addGroup(newDefaultGroup);
                return newDefaultGroup;
            }
            // Use one specified as default, if one exists
            const defaultGroup = groups.find((g) => g.isDefault);
            if (defaultGroup) {
                return defaultGroup;
            }
            // That may have been deleted, so just return the first group
            // alphabetical, otherwise
            const sortedGroups = groups.sort((a, b) => a.name.localeCompare(b.name));
            return sortedGroups[0];
        });
    }
    /**
     * Writes a new set of connection groups to the settings.
     * @param connGroups The set of connection groups to save.
     */
    writeGroups(connGroups) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._vscodeWrapper.setConfiguration(Constants.extensionName, Constants.serverGroupsArrayName, connGroups);
        });
    }
    /**
     * Adds a new connection group to the settings.
     * @param group The connection group to add.
     */
    addGroup(group) {
        return __awaiter(this, void 0, void 0, function* () {
            const connGroups = this.getGroups();
            connGroups.push(group);
            yield this.writeGroups(connGroups);
        });
    }
    /**
     * Updates an existing connection group in the settings.
     * @param group The connection group to update.
     * @throws Error if the group with the specified ID is not found.
     */
    updateGroup(group) {
        return __awaiter(this, void 0, void 0, function* () {
            const connGroups = this.getGroups();
            const index = connGroups.findIndex((g) => g.id === group.id);
            if (index !== -1) {
                this._logger.log(`Updating group: ${group.name}`);
                connGroups[index] = group;
                yield this.writeGroups(connGroups);
            }
            else {
                this._logger.error(`Error updating group: ${group.name}: Group not found`);
                throw new Error(locConstants_1.ServerGroups.groupNotFound(group.id));
            }
        });
    }
    /**
     * Checks if a connection group name is unique.
     * @param name The name to check for uniqueness.
     * @param id The ID of the group to exclude from the check (optional).
     * @returns A promise that resolves to `true` if the name is unique, otherwise `false`.
     */
    isNameUnique(name, id) {
        return __awaiter(this, void 0, void 0, function* () {
            const connGroups = this.getGroups();
            return !connGroups.some((group) => group.name === name && group.id !== id);
        });
    }
    /**
     * Checks if a group with the given ID exists in the connection groups
     * @param groupId The ID of the group to check for existence.
     * @returns A boolean indicating whether the group exists.
     */
    groupExists(groupId) {
        const groups = this.getGroups();
        return groups.some((group) => group.id === groupId);
    }
    /**
     * Ensures that all missing group IDs are added to the connection groups.
     * @param missingGroupIds A set of missing group IDs to be added.
     */
    addMissingGroups(missingGroupIds) {
        return __awaiter(this, void 0, void 0, function* () {
            if (missingGroupIds.size > 0) {
                const groups = this.getGroups();
                const existingNames = new Set(groups.map((g) => g.name));
                for (const groupId of missingGroupIds) {
                    const group = {
                        name: ServerGroupManager.generateUniqueGroupName(defaultGroupName, existingNames),
                        id: groupId,
                    };
                    existingNames.add(group.name); // Ensure the new name is also tracked
                    groups.push(group);
                }
                yield this.writeGroups(groups);
            }
        });
    }
    /**
     * Removes a server group by its ID.
     * @param groupId The ID of the server group to remove.
     * @throws Error if the group with the specified ID is not found.
     */
    removeServerGroup(groupId) {
        return __awaiter(this, void 0, void 0, function* () {
            const groups = this.getGroups();
            const index = groups.findIndex((g) => g.id === groupId);
            if (index !== -1) {
                groups.splice(index, 1);
                yield this.writeGroups(groups);
            }
            else {
                throw new Error(`Server group with ID '${groupId}' not found.`);
            }
        });
    }
    /**
     * Generates a unique name for a group by appending a numeric suffix if necessary.
     * @param baseName The base name to use for the group.
     * @param existingNames A set of existing group names to ensure uniqueness.
     * @returns A unique group name.
     */
    static generateUniqueGroupName(baseName, existingNames) {
        let counter = 1;
        let uniqueName = baseName;
        while (existingNames.has(uniqueName)) {
            uniqueName = `${baseName} ${counter}`;
            counter++;
        }
        return uniqueName;
    }
    /**
     * Handles the edit server group command.
     * @param node The node representing the server group.
     * @param context The extension context.
     * @param vscodeWrapper The VS Code wrapper.
     * @param objectExplorerProvider The object explorer provider.
     */
    handleEditServerGroup(node, context, vscodeWrapper, objectExplorerProvider) {
        const groupId = node.nodePath;
        const group = this.getGroupById(groupId);
        if (!group) {
            vscodeWrapper.showErrorMessage(locConstants_1.ServerGroups.groupNotFound(groupId));
            return;
        }
        const state = {
            serverGroup: group,
            isEditing: true,
        };
        const nodeUpdateFn = (updatedGroup) => {
            node.label = updatedGroup.name;
            objectExplorerProvider.updateNode(node);
            objectExplorerProvider.refresh(undefined);
        };
        const serverGroupController = new serverGroupWebviewController_1.ServerGroupWebviewController(context, vscodeWrapper, state, this, nodeUpdateFn);
        serverGroupController.revealToForeground();
    }
    /**
     * Handles the create server group command.
     * @param context The extension context.
     * @param vscodeWrapper The VS Code wrapper.
     * @param objectExplorerProvider The object explorer provider.
     */
    handleCreateServerGroup(context, vscodeWrapper, objectExplorerProvider) {
        const state = {
            serverGroup: {
                id: Utils.generateGuid(),
                name: "",
                description: "",
            },
            isEditing: false,
        };
        const nodeUpdateFn = (group) => {
            objectExplorerProvider.addServerGroupNode(group);
            objectExplorerProvider.refresh(undefined);
        };
        const serverGroupController = new serverGroupWebviewController_1.ServerGroupWebviewController(context, vscodeWrapper, state, this, nodeUpdateFn);
        serverGroupController.revealToForeground();
    }
    /**
     * Handles the delete server group command.
     * @param groupNode The node representing the server group.
     * @param objectExplorerProvider The object explorer provider.
     */
    handleDeleteServerGroup(groupNode, objectExplorerProvider, connectionStore) {
        return __awaiter(this, void 0, void 0, function* () {
            if (groupNode.children.length > 0) {
                const yes = vscode.l10n.t("Yes");
                const confirm = yield vscode.window.showWarningMessage(vscode.l10n.t("Are you sure you want to delete this server group? All connections in this group will also be removed."), { modal: true }, yes);
                if (confirm !== yes) {
                    return;
                }
            }
            const children = [...groupNode.children];
            for (const serverNode of children) {
                yield objectExplorerProvider.removeObjectExplorerNode(serverNode);
                const profile = serverNode.connectionInfo;
                yield connectionStore.removeProfile(profile);
            }
            yield this.removeServerGroup(groupNode.id);
            yield objectExplorerProvider.removeObjectExplorerNode(groupNode);
            objectExplorerProvider.refresh(undefined);
        });
    }
}
exports.ServerGroupManager = ServerGroupManager;

//# sourceMappingURL=serverGroupManager.js.map
