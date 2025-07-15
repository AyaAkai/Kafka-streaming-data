"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrereqState = exports.DisplayedPage = exports.DockerCreateWebviewState = void 0;
const webview_1 = require("./webview");
class DockerCreateWebviewState {
    /** The underlying connection profile for the form target; a more intuitively-named alias for `formState` */
    get creationProfile() {
        return this.formState;
    }
    set creationProfile(value) {
        this.formState = value;
    }
    constructor(params) {
        /** the underlying connection profile for the form target; same as `connectionProfile` */
        this.formState = {};
        this.formComponents = {};
        this.creationComponents = {
            mainOptions: [],
            topAdvancedOptions: [],
            groupedAdvancedOptions: [],
        };
        this.formError = "";
        this.connectionStatus = webview_1.ApiStatus.NotStarted;
        this.page = DisplayedPage.HOME;
        this.prereqs = [];
        for (const key in params) {
            if (key in this) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any -- safe due to key in this check being a Partial of the class
                this[key] =
                    params[key];
            }
        }
    }
}
exports.DockerCreateWebviewState = DockerCreateWebviewState;
var DisplayedPage;
(function (DisplayedPage) {
    DisplayedPage["HOME"] = "home";
    DisplayedPage["PREREQ"] = "prereq";
    DisplayedPage["CREATE"] = "create";
})(DisplayedPage || (exports.DisplayedPage = DisplayedPage = {}));
var PrereqState;
(function (PrereqState) {
    PrereqState["SUCCESS"] = "success";
    PrereqState["WAITING"] = "info";
    PrereqState["FAILED"] = "error";
})(PrereqState || (exports.PrereqState = PrereqState = {}));

//# sourceMappingURL=dockerCreate.js.map
