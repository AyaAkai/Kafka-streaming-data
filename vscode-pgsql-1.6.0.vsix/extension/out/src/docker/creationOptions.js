"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.DockerCreateOptions = void 0;
const Loc = require("../constants/locConstants");
const form_1 = require("../reactviews/common/forms/form");
const constants_1 = require("../constants/constants");
var DockerCreateOptions;
(function (DockerCreateOptions) {
    function getDockerCreateOptions() {
        const components = {}; // force empty record for initial blank state
        components["containerName"] = {
            propertyName: "containerName",
            label: Loc.CreateDialog.Fields.containerNameLabel,
            required: true,
            type: form_1.FormItemType.Input,
            isAdvancedOption: false,
            tooltip: Loc.CreateDialog.Fields.containerNameTooltop,
            validate: (state, value) => {
                if (value && value.match(constants_1.DockerConstants.dockerContainerNameRegex)) {
                    return {
                        isValid: true,
                        validationMessage: "",
                    };
                }
                return {
                    isValid: false,
                    validationMessage: Loc.CreateDialog.Fields.containerNameValidation,
                };
            },
        };
        components["user"] = {
            propertyName: "user",
            label: Loc.CreateDialog.Fields.usernameLabel,
            required: true,
            type: form_1.FormItemType.Input,
            isAdvancedOption: false,
            tooltip: Loc.CreateDialog.Fields.usernameTooltip,
            validate: (state, value) => {
                if (value && value.match(constants_1.DockerConstants.pgUsernameRegex)) {
                    return {
                        isValid: true,
                        validationMessage: "",
                    };
                }
                return {
                    isValid: false,
                    validationMessage: Loc.CreateDialog.Fields.usernameValidation,
                };
            },
        };
        components["password"] = {
            propertyName: "password",
            label: Loc.CreateDialog.Fields.passwordLabel,
            required: true,
            type: form_1.FormItemType.Password,
            isAdvancedOption: false,
            tooltip: Loc.CreateDialog.Fields.passwordTooltip,
        };
        components["savePassword"] = {
            propertyName: "savePassword",
            label: Loc.ConnectionDialog.savePassword,
            required: false,
            type: form_1.FormItemType.Checkbox,
            isAdvancedOption: false,
        };
        components["database"] = {
            propertyName: "database",
            label: Loc.CreateDialog.Fields.databaseLabel,
            required: false,
            type: form_1.FormItemType.Input,
            isAdvancedOption: false,
            tooltip: Loc.CreateDialog.Fields.databaseTooltip,
            validate: (state, value) => {
                if (value && value.match(constants_1.DockerConstants.pgUsernameRegex)) {
                    return {
                        isValid: true,
                        validationMessage: "",
                    };
                }
                return {
                    isValid: false,
                    validationMessage: Loc.CreateDialog.Fields.databaseValidation,
                };
            },
        };
        components["port"] = {
            propertyName: "port",
            label: Loc.CreateDialog.Fields.portLabel,
            required: false,
            type: form_1.FormItemType.Input,
            isAdvancedOption: true,
            tooltip: Loc.CreateDialog.Fields.portTooltip,
            validate: (state, value) => {
                const intValue = parseInt(value);
                if (Number.isNaN(intValue) ||
                    constants_1.DockerConstants.dockerBindPortMin > intValue ||
                    constants_1.DockerConstants.dockerBindPortMax < intValue) {
                    return {
                        isValid: false,
                        validationMessage: Loc.CreateDialog.Fields.portValidation,
                    };
                }
                return {
                    isValid: true,
                    validationMessage: "",
                };
            },
        };
        components["imageVersion"] = {
            propertyName: "imageVersion",
            label: Loc.CreateDialog.Fields.versionLabel,
            required: false,
            type: form_1.FormItemType.Input,
            isAdvancedOption: true,
            tooltip: Loc.CreateDialog.Fields.versionTooltip,
        };
        components["imageRegistry"] = {
            propertyName: "imageRegistry",
            label: Loc.CreateDialog.Fields.registryLabel,
            required: false,
            type: form_1.FormItemType.Input,
            isAdvancedOption: true,
            tooltip: Loc.CreateDialog.Fields.registryTooltip,
        };
        components["imageName"] = {
            propertyName: "imageName",
            label: Loc.CreateDialog.Fields.imgNameLabel,
            required: false,
            type: form_1.FormItemType.Input,
            isAdvancedOption: true,
            tooltip: Loc.CreateDialog.Fields.imgNameTooltip,
        };
        components["platform"] = {
            propertyName: "platform",
            label: Loc.CreateDialog.Fields.platformLabel,
            required: false,
            type: form_1.FormItemType.Input,
            isAdvancedOption: true,
            tooltip: Loc.CreateDialog.Fields.platformTooltip,
        };
        return components;
    }
    DockerCreateOptions.getDockerCreateOptions = getDockerCreateOptions;
})(DockerCreateOptions || (exports.DockerCreateOptions = DockerCreateOptions = {}));

//# sourceMappingURL=creationOptions.js.map
