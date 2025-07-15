"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreationHubWebviewController = void 0;
const vscode = require("vscode");
const reactWebviewPanelController_1 = require("./reactWebviewPanelController");
class CreationHubWebviewController extends reactWebviewPanelController_1.ReactWebviewPanelController {
    constructor(context, vscodeWrapper, _serverCreateService, groupId) {
        super(context, vscodeWrapper, "creationHub", "creationHub", {}, {
            title: "Create New Server",
            viewColumn: vscode.ViewColumn.Active,
            iconPath: {
                dark: vscode.Uri.joinPath(context.extensionUri, "media", "pgsqlServerCreate_dark.svg"),
                light: vscode.Uri.joinPath(context.extensionUri, "media", "pgsqlServerCreate_light.svg"),
            },
        });
        this._serverCreateService = _serverCreateService;
        this.groupId = groupId;
        this.registerReducer("create", (state, payload) => {
            this._serverCreateService.handleCreateTypeCallback(payload, this.groupId);
            this.panel.dispose();
            return state;
        });
    }
}
exports.CreationHubWebviewController = CreationHubWebviewController;

//# sourceMappingURL=creationHubWebviewController.js.map
