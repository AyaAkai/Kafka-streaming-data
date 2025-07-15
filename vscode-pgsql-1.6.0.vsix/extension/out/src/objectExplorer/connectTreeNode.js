"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectTreeNode = void 0;
const vscode = require("vscode");
const LocalizedConstants = require("../constants/locConstants");
const Constants = require("../constants/constants");
class ConnectTreeNode extends vscode.TreeItem {
    constructor(_parentNode) {
        let label = LocalizedConstants.msgConnect;
        let iconPath = undefined;
        let tooltip = undefined;
        if (_parentNode.errorMessage) {
            label = LocalizedConstants.msgConnectWithError;
            iconPath = new vscode.ThemeIcon("error", new vscode.ThemeColor("errorForeground"));
            tooltip = _parentNode.errorMessage;
        }
        super(label, vscode.TreeItemCollapsibleState.None);
        this._parentNode = _parentNode;
        this.iconPath = iconPath;
        this.tooltip = tooltip;
        this.command = {
            title: LocalizedConstants.msgConnect,
            command: Constants.cmdConnectObjectExplorerNode,
            arguments: [this],
        };
    }
    get parentNode() {
        return this._parentNode;
    }
}
exports.ConnectTreeNode = ConnectTreeNode;

//# sourceMappingURL=connectTreeNode.js.map
