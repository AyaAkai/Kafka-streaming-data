"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectionLensManager = void 0;
const vscode = require("vscode");
const connectionLensProvider_1 = require("./connectionLensProvider");
const Constants = require("../constants/constants");
class ConnectionLensManager {
    constructor(_context, _connectionManager, _sqlCodeLensProvider) {
        this._context = _context;
        this._connectionManager = _connectionManager;
        this._sqlCodeLensProvider = _sqlCodeLensProvider;
    }
    activate() {
        if (!this._sqlCodeLensProvider) {
            this._sqlCodeLensProvider = new connectionLensProvider_1.ConnectionLensProvider(this._context, this._connectionManager);
        }
        this.refreshCodeLensProvider();
        this._context.subscriptions.push(vscode.workspace.onDidChangeConfiguration((e) => {
            if (e.affectsConfiguration(Constants.configShowConnectionStatusLens)) {
                this.refreshCodeLensProvider();
            }
        }));
    }
    refreshCodeLensProvider() {
        const enabled = vscode.workspace
            .getConfiguration()
            .get(Constants.configShowConnectionStatusLens, true);
        if (enabled && !this._codeLensRegistration) {
            this._codeLensRegistration = vscode.languages.registerCodeLensProvider({ language: Constants.languageId }, this._sqlCodeLensProvider);
            this._context.subscriptions.push(this._codeLensRegistration);
        }
        else if (!enabled && this._codeLensRegistration) {
            this._codeLensRegistration.dispose();
            this._codeLensRegistration = undefined;
        }
    }
}
exports.ConnectionLensManager = ConnectionLensManager;

//# sourceMappingURL=connectionLensManager.js.map
