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
exports.ServerGroupWebviewController = void 0;
const vscode = require("vscode");
const node_util_1 = require("node:util");
const reactWebviewPanelController_1 = require("../controllers/reactWebviewPanelController");
const telemetry_1 = require("../telemetry/telemetry");
const telemetry_2 = require("../sharedInterfaces/telemetry");
const locConstants_1 = require("../constants/locConstants");
const MAX_GROUP_NAME_LENGTH = 250;
class ServerGroupWebviewController extends reactWebviewPanelController_1.ReactWebviewPanelController {
    constructor(context, vscodeWrapper, initialState, serverGroupMgr, updateNodeFn) {
        const title = initialState.isEditing ? locConstants_1.ServerGroups.editServerGroupTitle : locConstants_1.ServerGroups.addServerGroupTitle;
        super(context, vscodeWrapper, "serverGroupDialog", "serverGroupDialog", initialState, {
            title,
            viewColumn: vscode.ViewColumn.Active,
        });
        this.serverGroupMgr = serverGroupMgr;
        this.updateNodeFn = updateNodeFn;
        this.handleSubmit = (state, group) => __awaiter(this, void 0, void 0, function* () {
            (0, telemetry_1.sendActionEvent)(telemetry_2.TelemetryViews.ServerGroup, telemetry_2.TelemetryActions.ServerGroupDialogSubmit);
            try {
                if ((0, node_util_1.isDeepStrictEqual)(state.serverGroup, group)) {
                    this.panel.dispose();
                    return state;
                }
                const validation = yield this.validateWithErrors(group);
                if (!validation.valid) {
                    state.error = validation.msg;
                    return state;
                }
                if (state.isEditing) {
                    yield this.serverGroupMgr.updateGroup(group);
                }
                else {
                    yield this.serverGroupMgr.addGroup(group);
                }
                this.updateNodeFn(group);
                this.dispose();
                this.panel.dispose();
                return state;
            }
            catch (error) {
                this.logger.error("Error saving server group: ", error);
                state.error = locConstants_1.ServerGroups.errorSavingGroup;
                return state;
            }
        });
        this.validateWithErrors = (group) => __awaiter(this, void 0, void 0, function* () {
            if (!group.name) {
                return { valid: false, msg: locConstants_1.ServerGroups.groupNameRequired };
            }
            if (group.name.length > MAX_GROUP_NAME_LENGTH) {
                return {
                    valid: false,
                    msg: locConstants_1.ServerGroups.groupNameExceedsLength(MAX_GROUP_NAME_LENGTH),
                };
            }
            const isUnique = yield this.serverGroupMgr.isNameUnique(group.name, group.id);
            if (!isUnique) {
                return {
                    valid: false,
                    msg: locConstants_1.ServerGroups.groupNameExists(group.name),
                };
            }
            return { valid: true, msg: undefined };
        });
        this.registerReducer("submit", (state, payload) => __awaiter(this, void 0, void 0, function* () {
            return this.handleSubmit(state, payload.group);
        }));
        this.registerReducer("cancel", () => __awaiter(this, void 0, void 0, function* () {
            (0, telemetry_1.sendActionEvent)(telemetry_2.TelemetryViews.ServerGroup, telemetry_2.TelemetryActions.ServerGroupDialogCancel);
            this.panel.dispose();
            return this.state;
        }));
        this.registerReducer("clearError", () => __awaiter(this, void 0, void 0, function* () {
            this.state.error = undefined;
            return this.state;
        }));
    }
}
exports.ServerGroupWebviewController = ServerGroupWebviewController;

//# sourceMappingURL=serverGroupWebviewController.js.map
