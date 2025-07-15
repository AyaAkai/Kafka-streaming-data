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
exports.activate = activate;
exports.deactivate = deactivate;
exports.getController = getController;
const vscode = require("vscode");
const mainController_1 = require("./controllers/mainController");
const vscodeWrapper_1 = require("./controllers/vscodeWrapper");
const constants_1 = require("./constants/constants");
const telemetry_1 = require("./telemetry/telemetry");
const telemetry_2 = require("./sharedInterfaces/telemetry");
let controller = undefined;
function activate(context) {
    return __awaiter(this, void 0, void 0, function* () {
        const startTime = new Date().getTime();
        let vscodeWrapper = new vscodeWrapper_1.default();
        controller = new mainController_1.default(context, undefined, vscodeWrapper);
        context.subscriptions.push(controller);
        // Checking if localization should be applied
        //let config = vscodeWrapper.getConfiguration(Constants.extensionConfigSectionName);
        //let applyLocalization = config[Constants.configApplyLocalization];
        // if (applyLocalization) {
        // 	LocalizedConstants.loadLocalizedConstants(vscode.env.language);
        // }
        // Check if GitHub Copilot is installed
        const copilotExtension = vscode.extensions.getExtension("GitHub.copilot");
        vscode.commands.executeCommand("setContext", "pgsql.copilot.isGHCInstalled", !!copilotExtension);
        // Exposed for testing purposes
        vscode.commands.registerCommand(constants_1.cmdGetControllerForTests, () => controller);
        yield controller.activate(context);
        const endTime = new Date().getTime();
        const elapsedTimeMs = endTime - startTime;
        (0, telemetry_1.sendActionEvent)(telemetry_2.TelemetryViews.General, telemetry_2.TelemetryActions.Activate, undefined, {
            elapsedTimeMs,
        });
        return {};
    });
}
// this method is called when your extension is deactivated
function deactivate() {
    return __awaiter(this, void 0, void 0, function* () {
        if (controller) {
            yield controller.deactivate();
            controller.dispose();
        }
    });
}
/**
 * Exposed for testing purposes
 */
function getController() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!controller) {
            let savedController = yield vscode.commands.executeCommand(constants_1.cmdGetControllerForTests);
            return savedController;
        }
        return controller;
    });
}

//# sourceMappingURL=extension.js.map
