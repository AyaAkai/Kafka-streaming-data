"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.DialogSandboxWebviewController = void 0;
const vscode = require("vscode");
const reactWebviewPanelController_1 = require("../controllers/reactWebviewPanelController");
class DialogSandboxWebviewController extends reactWebviewPanelController_1.ReactWebviewPanelController {
    constructor(context, vscodeWrapper, state) {
        super(context, vscodeWrapper, "dialogSandbox", "dialogSandbox", state, {
            title: "Dialog Sandbox",
            viewColumn: vscode.ViewColumn.Beside,
        });
    }
}
exports.DialogSandboxWebviewController = DialogSandboxWebviewController;

//# sourceMappingURL=dialogSandboxWebviewController.js.map
