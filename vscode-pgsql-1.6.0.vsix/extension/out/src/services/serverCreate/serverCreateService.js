"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerCreateService = void 0;
const vscode = require("vscode");
const vscodeWrapper_1 = require("../../controllers/vscodeWrapper");
const Constants = require("../../constants/constants");
const treeNodeInfo_1 = require("../../objectExplorer/treeNodeInfo");
const creationHubWebviewController_1 = require("../../controllers/creationHubWebviewController");
const creationHub_1 = require("../../sharedInterfaces/creationHub");
const dockerCreateWebviewController_1 = require("../../controllers/dockerCreateWebviewController");
const logger_1 = require("../../models/logger");
class ServerCreateService {
    constructor(_context, _vscodeWrapper, _mainController, _objectExplorerProvider) {
        this._context = _context;
        this._vscodeWrapper = _vscodeWrapper;
        this._mainController = _mainController;
        this._objectExplorerProvider = _objectExplorerProvider;
        if (!_vscodeWrapper) {
            this._vscodeWrapper = new vscodeWrapper_1.default();
        }
        this._logger = logger_1.Logger.create(this._vscodeWrapper.outputChannel, "ServerCreateService");
    }
    registerCommands() {
        this._context.subscriptions.push(vscode.commands.registerCommand(Constants.cmdCreateNewDb, (node) => {
            const groupId = node instanceof treeNodeInfo_1.ServerGroupNodeInfo ? node.id : undefined;
            const createDialog = new creationHubWebviewController_1.CreationHubWebviewController(this._context, this._vscodeWrapper, this, groupId);
            createDialog.revealToForeground();
        }));
        this._context.subscriptions.push(vscode.commands.registerCommand(Constants.cmdCreateDockerDb, (groupId) => {
            const createDialog = new dockerCreateWebviewController_1.DockerCreateWebviewController(this._context, this._vscodeWrapper, this._mainController, this._objectExplorerProvider, groupId);
            createDialog.revealToForeground();
        }));
        /* This registration is commented out pending feature approval */
        /*
        this._context.subscriptions.push(
            vscode.commands.registerCommand(Constants.cmdCreateAzureFreeTier, () => {
                const freeTierDialog = new FreeTierWebviewController(
                    this._context,
                    this._vscodeWrapper,
                    this._mainController,
                    this._objectExplorerProvider,
                );
                freeTierDialog.revealToForeground();
            }),
        );
        */
    }
    handleCreateTypeCallback(createType, groupId) {
        switch (createType) {
            case creationHub_1.CreateType.DOCKER:
                this._vscodeWrapper.executeCommand(Constants.cmdCreateDockerDb, groupId);
                return;
            default:
                this._logger.logDebug(`Unsupported action: ${createType}`);
        }
    }
}
exports.ServerCreateService = ServerCreateService;

//# sourceMappingURL=serverCreateService.js.map
