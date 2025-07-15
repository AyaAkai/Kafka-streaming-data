"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.DisplayState = exports.FreeTierWebviewState = void 0;
class FreeTierWebviewState {
    constructor(params) {
        this.formState = {};
        this.displayState = DisplayState.GithubLogin;
        this.formComponents = {};
        this.bannerState = {
            hide: true,
            level: "info",
            title: "",
            text: "",
        };
        this.db_url = "";
        for (const key in params) {
            if (key in this) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any -- safe due to key in this check being a Partial of the class
                this[key] =
                    params[key];
            }
        }
    }
}
exports.FreeTierWebviewState = FreeTierWebviewState;
var DisplayState;
(function (DisplayState) {
    DisplayState["GithubLogin"] = "githubLogin";
    DisplayState["CreateOptions"] = "createOptions";
    DisplayState["ExistingInstance"] = "existingInstance";
    DisplayState["CreatingInstance"] = "creatingInstance";
    DisplayState["CreatedInstance"] = "createdInstance";
})(DisplayState || (exports.DisplayState = DisplayState = {}));

//# sourceMappingURL=freeTierDialog.js.map
