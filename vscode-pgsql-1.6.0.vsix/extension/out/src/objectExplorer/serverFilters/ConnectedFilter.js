"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnlyConnectedServerFilter = void 0;
const constants_1 = require("../../constants/constants");
/**
 * Only show connected servers.
 */
class OnlyConnectedServerFilter {
    constructor() {
        this.id = "onlyConnected";
        this.isEnabled = false;
        this.contextKey = "pgObjectExplorer.showOnlyConnected";
        this.activateCmd = "pgsql.objectExplorerShowOnlyConnected";
        this.deactivateCmd = "pgsql.objectExplorerShowAllServers";
    }
    apply(groups) {
        // Do not mutate original groups/children
        return groups.map((group) => {
            if (Array.isArray(group.children)) {
                const filteredGroup = Object.assign(Object.create(Object.getPrototypeOf(group)), group);
                filteredGroup.children = group.children.filter((node) => node.nodeType !== constants_1.disconnectedServerNodeType);
                return filteredGroup;
            }
            return group;
        });
    }
}
exports.OnlyConnectedServerFilter = OnlyConnectedServerFilter;

//# sourceMappingURL=ConnectedFilter.js.map
