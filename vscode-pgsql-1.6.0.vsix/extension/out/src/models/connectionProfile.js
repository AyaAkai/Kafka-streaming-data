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
exports.ConnectionProfile = void 0;
const vscode = require("vscode");
const LocalizedConstants = require("../constants/locConstants");
const interfaces_1 = require("./interfaces");
const connectionCredentials_1 = require("./connectionCredentials");
const question_1 = require("../prompts/question");
const utils = require("./utils");
const providerSettings_1 = require("../azure/providerSettings");
const azure_1 = require("./contracts/azure");
const utils_1 = require("../azure/utils");
const telemetry_1 = require("../telemetry/telemetry");
const telemetry_2 = require("../sharedInterfaces/telemetry");
// Concrete implementation of the IConnectionProfile interface
/**
 * A concrete implementation of an IConnectionProfile with support for profile creation and validation
 */
class ConnectionProfile extends connectionCredentials_1.ConnectionCredentials {
    constructor(connectionCredentials) {
        super();
        if (connectionCredentials) {
            // TODO-PG: check if these properties are applicable
            this.accountId = connectionCredentials.accountId;
            this.tenantId = connectionCredentials.tenantId;
            this.authenticationType = connectionCredentials.authenticationType;
            this.azureAccountToken = connectionCredentials.azureAccountToken;
            this.azureSubscriptionId = connectionCredentials.azureSubscriptionId;
            this.azureResourceGroup = connectionCredentials.azureResourceGroup;
            this.expiresOn = connectionCredentials.expiresOn;
            this.database = connectionCredentials.database;
            this.email = connectionCredentials.email;
            this.user = connectionCredentials.user;
            this.password = connectionCredentials.password;
            this.server = connectionCredentials.server;
        }
    }
    /**
     * Creates a new profile by prompting the user for information.
     * @param prompter that asks user the questions needed to complete a profile
     * @param (optional) default profile values that will be prefilled for questions, if any
     * @returns Promise - resolves to undefined if profile creation was not completed, or IConnectionProfile if completed
     */
    static createProfile(prompter, connectionStore, context, azureController, accountStore, defaultProfileValues) {
        return __awaiter(this, void 0, void 0, function* () {
            let profile = new ConnectionProfile();
            // Ensure all core properties are entered
            let authOptions = connectionCredentials_1.ConnectionCredentials.getAuthenticationTypesChoice();
            if (authOptions.length === 1) {
                // Set default value as there is only 1 option
                profile.authenticationType = authOptions[0].value;
            }
            let azureAccountChoices = ConnectionProfile.getAccountChoices(accountStore);
            let accountAnswer;
            azureAccountChoices.unshift({
                name: LocalizedConstants.azureAddAccount,
                value: "addAccount",
            });
            let tenantChoices = [];
            let questions = yield connectionCredentials_1.ConnectionCredentials.getRequiredCredentialValuesQuestions(profile, true, false, connectionStore, defaultProfileValues);
            // Check if password needs to be saved
            questions.push({
                type: question_1.QuestionTypes.confirm,
                name: LocalizedConstants.msgSavePassword,
                message: LocalizedConstants.msgSavePassword,
                shouldPrompt: () => !profile.connectionString &&
                    connectionCredentials_1.ConnectionCredentials.isPasswordBasedCredential(profile),
                onAnswered: (value) => (profile.savePassword = value),
            }, {
                type: question_1.QuestionTypes.expand,
                name: LocalizedConstants.aad,
                message: LocalizedConstants.azureChooseAccount,
                choices: azureAccountChoices,
                shouldPrompt: () => profile.isAzureActiveDirectory(),
                onAnswered: (value) => __awaiter(this, void 0, void 0, function* () {
                    var _a;
                    accountAnswer = value;
                    if (value !== "addAccount") {
                        let account = value;
                        profile.accountId = account === null || account === void 0 ? void 0 : account.key.id;
                        tenantChoices.push(...(_a = account === null || account === void 0 ? void 0 : account.properties) === null || _a === void 0 ? void 0 : _a.tenants.map((t) => ({
                            name: t.displayName,
                            value: t,
                        })));
                        if (tenantChoices.length === 1) {
                            profile.tenantId = tenantChoices[0].value.id;
                        }
                        try {
                            profile = yield azureController.refreshTokenWrapper(profile, accountStore, accountAnswer, providerSettings_1.default.resources.databaseResource);
                        }
                        catch (error) {
                            console.log(`Refreshing tokens failed: ${error}`);
                        }
                    }
                    else {
                        try {
                            profile = yield azureController.populateAccountProperties(profile, accountStore, providerSettings_1.default.resources.databaseResource);
                            if (profile) {
                                vscode.window.showInformationMessage(LocalizedConstants.accountAddedSuccessfully(profile.email));
                            }
                        }
                        catch (e) {
                            console.error(`Could not add account: ${e}`);
                            vscode.window.showErrorMessage(e);
                        }
                    }
                }),
            }, {
                type: question_1.QuestionTypes.expand,
                name: LocalizedConstants.tenant,
                message: LocalizedConstants.azureChooseTenant,
                choices: tenantChoices,
                default: defaultProfileValues ? defaultProfileValues.tenantId : undefined,
                // Need not prompt for tenant question when 'Sql Authentication Provider' is enabled,
                // since tenant information is received from Server with authority URI in the Login flow.
                shouldPrompt: () => profile.isAzureActiveDirectory() &&
                    tenantChoices.length > 1 &&
                    !(0, utils_1.getEnableSqlAuthenticationProviderConfig)(),
                onAnswered: (value) => {
                    profile.tenantId = value.id;
                },
            }, {
                type: question_1.QuestionTypes.input,
                name: LocalizedConstants.ConnectionDialog.profileName,
                message: LocalizedConstants.ConnectionDialog.profileName,
                placeHolder: LocalizedConstants.profileNamePlaceholder,
                default: defaultProfileValues ? defaultProfileValues.profileName : undefined,
                onAnswered: (value) => {
                    // Fall back to a default name if none specified
                    profile.profileName = value ? value : undefined;
                },
            });
            const answers = yield prompter.prompt(questions, true);
            if (answers && profile.isValidProfile()) {
                (0, telemetry_1.sendActionEvent)(telemetry_2.TelemetryViews.ConnectionPrompt, telemetry_2.TelemetryActions.CreateConnectionResult, {
                    authenticationType: profile.authenticationType,
                    passwordSaved: profile.savePassword ? "true" : "false",
                });
                ConnectionProfile.addIdIfMissing(profile);
                return profile;
            }
            // returning undefined to indicate failure to create the profile
            return undefined;
        });
    }
    static addIdIfMissing(profile) {
        if (profile && profile.id === undefined) {
            profile.id = utils.generateGuid();
            return true;
        }
        return false;
    }
    // Assumption: having connection string or server + profile name indicates all requirements were met
    isValidProfile() {
        if (this.connectionString) {
            return true;
        }
        if (this.authenticationType) {
            if (this.authenticationType === interfaces_1.AuthenticationTypes[interfaces_1.AuthenticationTypes.Integrated] ||
                this.authenticationType === interfaces_1.AuthenticationTypes[interfaces_1.AuthenticationTypes.AzureMFA]) {
                return utils.isNotEmpty(this.server);
            }
            else {
                return utils.isNotEmpty(this.server) && utils.isNotEmpty(this.user);
            }
        }
        return false;
    }
    isAzureActiveDirectory() {
        return this.authenticationType === interfaces_1.AuthenticationTypes[interfaces_1.AuthenticationTypes.AzureMFA];
    }
    static getAzureAuthChoices() {
        let choices = [
            {
                name: LocalizedConstants.azureAuthTypeCodeGrant,
                value: utils.azureAuthTypeToString(azure_1.AzureAuthType.AuthCodeGrant),
            },
            {
                name: LocalizedConstants.azureAuthTypeDeviceCode,
                value: utils.azureAuthTypeToString(azure_1.AzureAuthType.DeviceCode),
            },
        ];
        return choices;
    }
    static getAccountChoices(accountStore) {
        var _a;
        let accounts = accountStore.getAccounts();
        let choices = [];
        if (accounts.length > 0) {
            for (let account of accounts) {
                choices.push({
                    name: (_a = account === null || account === void 0 ? void 0 : account.displayInfo) === null || _a === void 0 ? void 0 : _a.displayName,
                    value: account,
                });
            }
        }
        return choices;
    }
}
exports.ConnectionProfile = ConnectionProfile;

//# sourceMappingURL=connectionProfile.js.map
