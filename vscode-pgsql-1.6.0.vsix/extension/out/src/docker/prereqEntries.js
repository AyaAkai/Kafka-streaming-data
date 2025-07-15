"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.DockerPrereqChecks = void 0;
const LocConstants = require("../constants/locConstants");
const helpers_1 = require("./helpers");
var DockerPrereqChecks;
(function (DockerPrereqChecks) {
    function getDockerPrereqs() {
        return [
            {
                title: LocConstants.CreateDialog.Prereqs.Installed.title,
                waitDesc: LocConstants.CreateDialog.Prereqs.Installed.desc,
                normDesc: LocConstants.CreateDialog.Prereqs.Installed.desc,
                failDesc: LocConstants.CreateDialog.Prereqs.Installed.desc,
                resText: LocConstants.CreateDialog.Prereqs.Installed.res,
                resLink: "https://docs.docker.com/get-started/get-docker/",
                runner: helpers_1.DockerHelpers.checkRuntime,
            },
            {
                title: LocConstants.CreateDialog.Prereqs.Running.title,
                waitDesc: LocConstants.CreateDialog.Prereqs.Running.normDesc,
                normDesc: LocConstants.CreateDialog.Prereqs.Running.normDesc,
                failDesc: LocConstants.CreateDialog.Prereqs.Running.failDesc,
                runner: helpers_1.DockerHelpers.checkService,
            },
        ];
    }
    DockerPrereqChecks.getDockerPrereqs = getDockerPrereqs;
})(DockerPrereqChecks || (exports.DockerPrereqChecks = DockerPrereqChecks = {}));

//# sourceMappingURL=prereqEntries.js.map
