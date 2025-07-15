"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerFilterManager = void 0;
const vscode = require("vscode");
/**
 * Manages registration and application of server filters.
 */
class ServerFilterManager {
    constructor() {
        this._filters = new Map();
    }
    registerFilter(filter) {
        this._filters.set(filter.id, filter);
    }
    setFilterEnabled(filterId, enabled) {
        const filter = this._filters.get(filterId);
        if (filter) {
            filter.isEnabled = enabled;
        }
    }
    isFilterEnabled(filterId) {
        var _a, _b;
        return (_b = (_a = this._filters.get(filterId)) === null || _a === void 0 ? void 0 : _a.isEnabled) !== null && _b !== void 0 ? _b : false;
    }
    get enabledFilters() {
        return Array.from(this._filters.values()).filter((f) => f.isEnabled);
    }
    /**
     * Applies all enabled filters in sequence to the server group nodes.
     */
    applyFilters(groups) {
        let result = groups;
        for (const filter of this.enabledFilters) {
            result = filter.apply(result);
        }
        return result;
    }
    /**
     * Syncs all filter context keys to their current enabled/disabled state.
     * Should be called when the filter state changes. Context keys are used to
     * show/hide the appropriate command buttons in the UI.
     */
    syncContextKeys() {
        for (const filter of this._filters.values()) {
            void vscode.commands.executeCommand("setContext", filter.contextKey, filter.isEnabled);
        }
    }
    /**
     * Registers toggle commands for all filters.
     */
    registerCommands(context, provider) {
        // Loop each filter and register its on/off commands. When the commands
        // are executed they set the context key for the filter and refresh the
        // object explorer tree to reflect the changes
        for (const filter of this._filters.values()) {
            context.subscriptions.push(vscode.commands.registerCommand(filter.activateCmd, () => {
                this.setFilterEnabled(filter.id, true);
                this.syncContextKeys();
                provider.refresh(undefined);
            }));
            context.subscriptions.push(vscode.commands.registerCommand(filter.deactivateCmd, () => {
                this.setFilterEnabled(filter.id, false);
                this.syncContextKeys();
                provider.refresh(undefined);
            }));
        }
    }
}
exports.ServerFilterManager = ServerFilterManager;

//# sourceMappingURL=serverFilterManager.js.map
