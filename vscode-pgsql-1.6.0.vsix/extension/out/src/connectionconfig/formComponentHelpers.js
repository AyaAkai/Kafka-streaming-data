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
exports.generateFreeTierComponents = generateFreeTierComponents;
exports.generateCreationComponents = generateCreationComponents;
exports.generateConnectionComponents = generateConnectionComponents;
exports.groupAdvancedOptions = groupAdvancedOptions;
exports.convertToFormComponent = convertToFormComponent;
exports.getDefaultServerGroupValue = getDefaultServerGroupValue;
exports.completeFormComponents = completeFormComponents;
const connectionDialog_1 = require("../sharedInterfaces/connectionDialog");
const form_1 = require("../reactviews/common/forms/form");
const telemetry_1 = require("../telemetry/telemetry");
const telemetry_2 = require("../sharedInterfaces/telemetry");
const Loc = require("../constants/locConstants");
const connection_1 = require("../models/contracts/connection");
const utils_1 = require("../utils/utils");
const connectionDialogWebviewController_1 = require("./connectionDialogWebviewController");
const connectionString_1 = require("../reactviews/pages/ConnectionDialog/connectionString");
const constants_1 = require("../constants/constants");
const creationOptions_1 = require("../docker/creationOptions");
const serverGroupManager_1 = require("./serverGroupManager");
function generateFreeTierComponents() {
    return __awaiter(this, void 0, void 0, function* () {
        const formComponents = {
            profileName: {
                propertyName: "profileName",
                label: Loc.CreateDialog.Fields.profileLabel,
                required: true,
                type: form_1.FormItemType.Input,
                tooltip: Loc.CreateDialog.Fields.profileTooltip,
                validate: (state, value) => {
                    if (value && value.match(constants_1.DockerConstants.dockerProfileNameRegex)) {
                        return {
                            isValid: true,
                            validationMessage: "",
                        };
                    }
                    return {
                        isValid: false,
                        validationMessage: Loc.CreateDialog.Fields.profileValidation,
                    };
                },
            },
            username: {
                propertyName: "username",
                label: Loc.CreateDialog.Fields.usernameLabel,
                required: true,
                type: form_1.FormItemType.Input,
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
            },
            password: {
                propertyName: "password",
                label: Loc.CreateDialog.Fields.passwordLabel,
                required: true,
                type: form_1.FormItemType.Password,
                tooltip: Loc.CreateDialog.Fields.passwordLabel,
            },
            dbName: {
                propertyName: "dbName",
                label: Loc.CreateDialog.Fields.databaseLabel,
                required: true,
                type: form_1.FormItemType.Input,
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
            },
        };
        return formComponents;
    });
}
function generateCreationComponents() {
    return __awaiter(this, void 0, void 0, function* () {
        const components = {}; // force empty record for initial blank state
        components["groupId"] = getServerGroupComponent();
        components["profileName"] = {
            propertyName: "profileName",
            label: Loc.CreateDialog.Fields.profileLabel,
            required: true,
            type: form_1.FormItemType.Input,
            isAdvancedOption: false,
            tooltip: Loc.CreateDialog.Fields.profileTooltip,
            validate: (state, value) => {
                if (value && value.match(constants_1.DockerConstants.dockerProfileNameRegex)) {
                    return {
                        isValid: true,
                        validationMessage: "",
                    };
                }
                return {
                    isValid: false,
                    validationMessage: Loc.CreateDialog.Fields.profileValidation,
                };
            },
        };
        Object.entries(creationOptions_1.DockerCreateOptions.getDockerCreateOptions()).forEach(([op, def]) => {
            components[op] = def;
        });
        return components;
    });
}
function generateConnectionComponents(connectionManager, azureAccountOptions, azureActionButtons) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        // get list of connection options from Tools Service
        const capabilitiesResult = yield connectionManager.client.sendRequest(connection_1.GetCapabilitiesRequest.type, {});
        const connectionOptions = capabilitiesResult.capabilities.connectionProvider.options;
        const groupNames = capabilitiesResult.capabilities.connectionProvider.groupDisplayNames || {};
        const result = {}; // force empty record for initial blank state
        const _mainOptionNames = new Set([
            ...connectionDialogWebviewController_1.ConnectionDialogWebviewController.mainOptions,
            "profileName",
        ]);
        for (const option of connectionOptions) {
            try {
                result[option.name] = Object.assign(Object.assign({}, convertToFormComponent(option)), { isAdvancedOption: !_mainOptionNames.has(option.name), optionCategory: option.groupName, optionCategoryLabel: (_a = groupNames[option.groupName]) !== null && _a !== void 0 ? _a : option.groupName });
            }
            catch (err) {
                console.error(`Error loading connection option '${option.name}': ${(0, utils_1.getErrorMessage)(err)}`);
                (0, telemetry_1.sendErrorEvent)(telemetry_2.TelemetryViews.ConnectionDialog, telemetry_2.TelemetryActions.LoadConnectionProperties, err, true, // includeErrorMessage
                undefined, // errorCode
                undefined, // errorType
                {
                    connectionOptionName: option.name,
                });
            }
        }
        // There are a few connection keys that are "special" within the
        // codebase, `server` and `database`. These also happen to differ
        // between mssql and PG (`host` and `dbname`, respectively). The PGTS
        // returns the properties that it is capable of receiving, and here we
        // are re-mapping the special keys to their mssql counterparts. This
        // allows fewer code changes, and the properties are mapped back to
        // their correct PG-specific names prior to sending a connection
        // request.
        // See: ConnectionCredentials.createConnectionDetails
        result.server = result["host"];
        result.server.propertyName = "server";
        result.database = result["dbname"];
        result.database.propertyName = "database";
        delete result["host"];
        delete result["dbname"];
        yield completeFormComponents(result, yield azureAccountOptions, yield azureActionButtons);
        return result;
    });
}
function groupAdvancedOptions(components, componentsInfo) {
    const groupMap = new Map([
    // intialize with display order; any that aren't pre-defined will be appended
    // these values must match the GroupName defined in PG Tools Service.
    ]);
    const optionsToGroup = Object.values(components).filter((c) => c.isAdvancedOption &&
        !componentsInfo.mainOptions.includes(c.propertyName) &&
        !componentsInfo.topAdvancedOptions.includes(c.propertyName));
    for (const option of optionsToGroup) {
        if (
        // new group ID or group ID hasn't been initialized yet
        !groupMap.has(option.optionCategory) ||
            groupMap.get(option.optionCategory) === undefined) {
            groupMap.set(option.optionCategory, {
                groupName: option.optionCategoryLabel,
                options: [option.propertyName],
            });
        }
        else {
            groupMap.get(option.optionCategory).options.push(option.propertyName);
        }
    }
    return Array.from(groupMap.values());
}
function convertToFormComponent(connOption) {
    switch (connOption.valueType) {
        case "boolean":
            return {
                propertyName: connOption.name,
                label: connOption.displayName,
                required: connOption.isRequired,
                type: form_1.FormItemType.Checkbox,
                tooltip: connOption.description,
            };
        case "string":
            return {
                propertyName: connOption.name,
                label: connOption.displayName,
                required: connOption.isRequired,
                type: form_1.FormItemType.Input,
                tooltip: connOption.description,
            };
        case "password":
            return {
                propertyName: connOption.name,
                label: connOption.displayName,
                required: connOption.isRequired,
                type: form_1.FormItemType.Password,
                tooltip: connOption.description,
            };
        case "number":
            return {
                propertyName: connOption.name,
                label: connOption.displayName,
                required: connOption.isRequired,
                type: form_1.FormItemType.Input,
                tooltip: connOption.description,
            };
        case "category":
            return {
                propertyName: connOption.name,
                label: connOption.displayName,
                required: connOption.isRequired,
                type: form_1.FormItemType.Dropdown,
                tooltip: connOption.description,
                options: connOption.categoryValues.map((v) => {
                    var _a;
                    return {
                        displayName: (_a = v.displayName) !== null && _a !== void 0 ? _a : v.name, // Use name if displayName is not provided
                        value: v.name,
                    };
                }),
            };
        case "azureAccountToken":
            return undefined;
        default:
            const error = `Unhandled connection option type: ${connOption.valueType}`;
            (0, telemetry_1.sendErrorEvent)(telemetry_2.TelemetryViews.ConnectionDialog, telemetry_2.TelemetryActions.LoadConnectionProperties, new Error(error), true);
    }
}
function getDefaultServerGroupValue() {
    return __awaiter(this, void 0, void 0, function* () {
        const serverGroupMgr = serverGroupManager_1.ServerGroupManager.getInstance();
        const defaultGroup = yield serverGroupMgr.getDefaultGroup();
        return defaultGroup.id;
    });
}
function getServerGroupOptions() {
    const serverGroupMgr = serverGroupManager_1.ServerGroupManager.getInstance();
    const serverGroups = serverGroupMgr.getGroups();
    return serverGroups.map((group) => {
        return {
            displayName: group.name,
            value: group.id,
        };
    });
}
function getServerGroupComponent() {
    return {
        propertyName: "groupId",
        label: Loc.ServerGroups.serverGroup,
        tooltip: Loc.ServerGroups.serverGroupTooltip,
        required: true,
        type: form_1.FormItemType.Dropdown,
        options: getServerGroupOptions(),
        placeholder: Loc.ConnectionDialog.selectAServerGroup,
        isAdvancedOption: false,
        validate: (state, value) => {
            const serverGroupMgr = serverGroupManager_1.ServerGroupManager.getInstance();
            if (!value || !serverGroupMgr.groupExists(value)) {
                return {
                    isValid: false,
                    validationMessage: Loc.ConnectionDialog.serverGroupIsRequired,
                };
            }
            return {
                isValid: true,
                validationMessage: "",
            };
        },
    };
}
function completeFormComponents(components, azureAccountOptions, azureActionButtons) {
    return __awaiter(this, void 0, void 0, function* () {
        // Add additional components that are not part of the connection options
        components["groupId"] = getServerGroupComponent();
        components["profileName"] = {
            propertyName: "profileName",
            label: Loc.ConnectionDialog.profileName,
            required: false,
            type: form_1.FormItemType.Input,
            isAdvancedOption: false,
        };
        components["savePassword"] = {
            propertyName: "savePassword",
            label: Loc.ConnectionDialog.savePassword,
            required: false,
            type: form_1.FormItemType.Checkbox,
            isAdvancedOption: false,
        };
        components["accountId"] = {
            propertyName: "accountId",
            label: Loc.ConnectionDialog.entraAccount,
            required: true,
            type: form_1.FormItemType.Dropdown,
            options: azureAccountOptions,
            placeholder: Loc.ConnectionDialog.selectAnAccount,
            actionButtons: azureActionButtons,
            validate: (state, value) => {
                if (state.connectionProfile.authenticationType === connectionDialog_1.AuthenticationType.AzureMFA &&
                    !value) {
                    return {
                        isValid: false,
                        validationMessage: Loc.ConnectionDialog.entraAccountIsRequired,
                    };
                }
                return {
                    isValid: true,
                    validationMessage: "",
                };
            },
            isAdvancedOption: false,
        };
        components["entraUserName"] = {
            propertyName: "entraUserName",
            label: Loc.ConnectionDialog.entraUserName,
            tooltip: Loc.ConnectionDialog.entraUserNameTooltip,
            required: true,
            type: form_1.FormItemType.Input,
            isAdvancedOption: false,
        };
        components["tenantId"] = {
            propertyName: "tenantId",
            label: Loc.ConnectionDialog.tenantId,
            tooltip: Loc.ConnectionDialog.tenantIdTooltip,
            required: true,
            type: form_1.FormItemType.Dropdown,
            options: [],
            placeholder: Loc.ConnectionDialog.selectATenant,
            validate: (state, value) => {
                if (state.connectionProfile.authenticationType === connectionDialog_1.AuthenticationType.AzureMFA &&
                    !value) {
                    return {
                        isValid: false,
                        validationMessage: Loc.ConnectionDialog.tenantIdIsRequired,
                    };
                }
                return {
                    isValid: true,
                    validationMessage: "",
                };
            },
            isAdvancedOption: false,
        };
        components["connectionString"] = {
            type: form_1.FormItemType.TextArea,
            propertyName: "connectionString",
            label: Loc.ConnectionDialog.connectionString,
            required: true,
            tooltip: "A connection string that includes all connection properties.",
            validate: (state, value) => {
                const getValidationMessage = (err) => {
                    if (err.unsupportedFormat) {
                        return Loc.ConnectionDialog.connectionStringUnsupported;
                    }
                    else if (err.missingParameters) {
                        let locMissing = [];
                        const missingServer = err.missingParameters.includes(connectionString_1.ConnectionStringParser.serverAttribute);
                        const missingUser = err.missingParameters.includes(connectionString_1.ConnectionStringParser.userAttribute);
                        if (missingServer) {
                            locMissing.push(Loc.ConnectionDialog.serverLabel);
                        }
                        if (missingUser) {
                            locMissing.push(Loc.ConnectionDialog.usernameLabel);
                        }
                        return (err.connectionStringType +
                            ": " +
                            Loc.msgMissingFields +
                            locMissing.join(", "));
                    }
                };
                if (!value) {
                    return {
                        isValid: false,
                        validationMessage: Loc.ConnectionDialog.connectionStringIsRequired,
                    };
                }
                const parser = new connectionString_1.ConnectionStringParser(value);
                const result = parser.getParameters();
                if (result.ok === false) {
                    const err = result.error;
                    const validationMessage = getValidationMessage(err);
                    // Send non-error telemetry for invalid connection string for informational purposes
                    (0, telemetry_1.sendActionEvent)(telemetry_2.TelemetryViews.ConnectionDialog, telemetry_2.TelemetryActions.ConnectionStringInvalid, {
                        unsupportedFormat: err.unsupportedFormat.toString(),
                        connectionStringType: err.connectionStringType || "",
                        missingParameters: (err.missingParameters || []).join(", "),
                    });
                    return {
                        isValid: false,
                        validationMessage: validationMessage,
                    };
                }
                else {
                    (0, telemetry_1.sendActionEvent)(telemetry_2.TelemetryViews.ConnectionDialog, telemetry_2.TelemetryActions.ConnectionStringInput, { connectionStringType: parser.detectedType });
                    return {
                        isValid: true,
                        validationMessage: "",
                    };
                }
            },
            isAdvancedOption: false,
        };
        // add missing validation functions for generated components
        components["server"].validate = (state, value) => {
            if (state.connectionProfile.authenticationType === connectionDialog_1.AuthenticationType.SqlLogin && !value) {
                return {
                    isValid: false,
                    validationMessage: Loc.ConnectionDialog.serverIsRequired,
                };
            }
            return {
                isValid: true,
                validationMessage: "",
            };
        };
        components["user"].validate = (state, value) => {
            if (state.connectionProfile.authenticationType === connectionDialog_1.AuthenticationType.SqlLogin && !value) {
                return {
                    isValid: false,
                    validationMessage: Loc.ConnectionDialog.usernameIsRequired,
                };
            }
            return {
                isValid: true,
                validationMessage: "",
            };
        };
    });
}

//# sourceMappingURL=formComponentHelpers.js.map
