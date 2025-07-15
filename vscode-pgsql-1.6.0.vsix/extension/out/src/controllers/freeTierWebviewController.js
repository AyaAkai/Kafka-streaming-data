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
exports.FreeTierWebviewController = void 0;
const vscode = require("vscode");
const telemetry_1 = require("../sharedInterfaces/telemetry");
const freeTierDialog_1 = require("../sharedInterfaces/freeTierDialog");
const Loc = require("../constants/locConstants");
const telemetry_2 = require("../telemetry/telemetry");
const logger_1 = require("../models/logger");
const vscodeWrapper_1 = require("./vscodeWrapper");
const utils_1 = require("../utils/utils");
const ftmsApi_1 = require("../ftms/ftmsApi");
const connectionDialog_1 = require("../sharedInterfaces/connectionDialog");
const constants_1 = require("../constants/constants");
const formWebviewController_1 = require("../forms/formWebviewController");
const formComponentHelpers_1 = require("../connectionconfig/formComponentHelpers");
class FreeTierWebviewController extends formWebviewController_1.FormWebviewController {
    constructor(context, vscodeWrapper, _mainController, _objectExplorerProvider) {
        super(context, vscodeWrapper, "azureFreeTier", "azureFreeTier", new freeTierDialog_1.FreeTierWebviewState(), {
            title: Loc.CreateDialog.createDialog,
            viewColumn: vscode.ViewColumn.Active,
            iconPath: {
                dark: vscode.Uri.joinPath(context.extensionUri, "media", "connectionDialogEditor_dark.svg"),
                light: vscode.Uri.joinPath(context.extensionUri, "media", "connectionDialogEditor_light.svg"),
            },
        });
        this._mainController = _mainController;
        this._objectExplorerProvider = _objectExplorerProvider;
        this._session = undefined;
        if (!FreeTierWebviewController._logger) {
            const vscodeWrapper = new vscodeWrapper_1.default();
            const channel = vscodeWrapper.createOutputChannel(Loc.CreateDialog.createDialog);
            FreeTierWebviewController._logger = logger_1.Logger.create(channel);
        }
        this.registerRpcHandlers();
        this.initializeDialog().catch((err) => {
            void vscode.window.showErrorMessage((0, utils_1.getErrorMessage)(err));
            (0, telemetry_2.sendErrorEvent)(telemetry_1.TelemetryViews.DockerCreate, telemetry_1.TelemetryActions.Initialize, err, true);
        });
    }
    initializeDialog() {
        return __awaiter(this, void 0, void 0, function* () {
            this.state.formComponents = yield (0, formComponentHelpers_1.generateFreeTierComponents)();
            this.updateState();
        });
    }
    setBanner(level, title, text) {
        this.state.bannerState = {
            hide: false,
            level: level,
            title: title,
            text: text,
        };
    }
    clearBanner() {
        this.state.bannerState = {
            hide: true,
            level: "info",
            title: "",
            text: "",
        };
    }
    updateItemVisibility() {
        return;
    }
    getActiveFormComponents(state) {
        return Object.entries(state.formComponents).map(([_1, formComponent], _2, _3) => {
            return formComponent.propertyName;
        });
    }
    registerRpcHandlers() {
        this.registerReducer("login", (state) => __awaiter(this, void 0, void 0, function* () {
            this.clearBanner();
            this.updateState();
            try {
                this._session = yield vscode.authentication.getSession("github", ["read:user"], {
                    createIfNone: true,
                    clearSessionPreference: true,
                });
            }
            catch (_a) {
                this.setBanner("error", "GitHub Login:", `VSCode failed to authenticate your GitHub account!`);
                this.updateState();
                return state;
            }
            try {
                const checkResult = yield ftmsApi_1.FtmsApi.CheckInstance(this._session);
                this.state.displayState = checkResult
                    ? freeTierDialog_1.DisplayState.ExistingInstance
                    : freeTierDialog_1.DisplayState.CreateOptions;
            }
            catch (_b) {
                this.setBanner("error", "Github Login:", "There was an unexpected issue looking up your account, please try again");
            }
            this.updateState();
            return state;
        }));
        this.registerReducer("create", (state) => __awaiter(this, void 0, void 0, function* () {
            this.clearBanner();
            this.state.displayState = freeTierDialog_1.DisplayState.CreatingInstance;
            this.updateState();
            try {
                const resp_json = yield ftmsApi_1.FtmsApi.CreateInstance(this._session, this.state.formState);
                this.state.db_url = resp_json["db_url"];
                this.state.displayState = freeTierDialog_1.DisplayState.CreatedInstance;
                this.updateState();
            }
            catch (_a) {
                this.setBanner("error", "Azure Free Tier:", "There was an unexpected issue creating your database, please try again");
                this.state.displayState = freeTierDialog_1.DisplayState.CreateOptions;
                this.updateState();
            }
            return state;
        }));
        this.registerReducer("connect", (state) => __awaiter(this, void 0, void 0, function* () {
            const connectionProfile = {
                applicationName: constants_1.connectionApplicationName,
                authenticationType: connectionDialog_1.AuthenticationType.SqlLogin,
                connectTimeout: constants_1.defaultConnectionTimeout,
                server: this.state.db_url,
                database: this.state.formState.dbName,
                password: this.state.formState.password,
                profileName: this.state.formState.profileName,
                user: this.state.formState.username,
                savePassword: true,
            };
            try {
                yield this._mainController.connectionManager.connectionUI.validateAndSaveProfileFromDialog(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                connectionProfile);
                yield this._mainController.connectionManager.connectionUI.saveProfile(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                connectionProfile);
                const node = yield this._mainController.createObjectExplorerSessionFromDialog(connectionProfile);
                this._objectExplorerProvider.refresh(undefined);
                yield this._mainController.safeRevealInObjectExplorer(node, {
                    focus: true,
                    select: true,
                    expand: true,
                });
            }
            catch (err) {
                console.log(err);
            }
            yield this.panel.dispose();
            return state;
        }));
        this.registerReducer("reconnect", (state) => __awaiter(this, void 0, void 0, function* () {
            this.clearBanner();
            console.log("reconnect");
            return state;
        }));
        this.registerReducer("delete", (state) => __awaiter(this, void 0, void 0, function* () {
            this.clearBanner();
            console.log("delete");
            return state;
        }));
    }
}
exports.FreeTierWebviewController = FreeTierWebviewController;

//# sourceMappingURL=freeTierWebviewController.js.map
