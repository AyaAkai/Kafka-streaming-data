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
exports.ConnectionCredentials = void 0;
const LocalizedConstants = require("../constants/locConstants");
const interfaces_1 = require("./interfaces");
const utils = require("./utils");
const constants_1 = require("../constants/constants");
const question_1 = require("../prompts/question");
// Concrete implementation of the IConnectionInfo interface
class ConnectionCredentials {
    /**
     * Create a connection details contract from connection credentials.
     */
    static createConnectionDetails(credentials) {
        let details = {
            options: {},
        };
        const user = credentials.authenticationType === constants_1.azureMfa
            ? credentials.entraUserName || credentials.email
            : credentials.user;
        details.options["host"] = credentials.server;
        if (credentials.port && details.options["host"].indexOf(",") === -1) {
            details.options["port"] = credentials.port;
        }
        details.options["dbname"] = credentials.database;
        details.options["user"] = user;
        details.options["password"] = credentials.password;
        details.options["authenticationType"] = credentials.authenticationType;
        details.options["azureAccountId"] = credentials.accountId;
        details.options["azureTenantId"] = credentials.tenantId;
        details.options["azureAccountToken"] = credentials.azureAccountToken;
        details.options["azureTokenExpiry"] = credentials.expiresOn;
        details.options["azureSubscriptionId"] = credentials.azureSubscriptionId;
        details.options["azureResourceGroup"] = credentials.azureResourceGroup;
        details.options["copilotAccessMode"] = credentials.copilotAccessMode;
        details.options["hostaddr"] = credentials.hostaddr;
        details.options["connectTimeout"] = credentials.connectTimeout;
        details.options["clientEncoding"] = credentials.clientEncoding;
        details.options["options"] = credentials.options;
        details.options["applicationName"] = credentials.applicationName;
        details.options["sslmode"] = credentials.sslmode;
        details.options["sslcompression"] = credentials.sslcompression;
        details.options["sslcert"] = credentials.sslcert;
        details.options["sslkey"] = credentials.sslkey;
        details.options["sslrootcert"] = credentials.sslrootcert;
        details.options["sslcrl"] = credentials.sslcrl;
        details.options["requirepeer"] = credentials.requirepeer;
        details.options["service"] = credentials.service;
        return details;
    }
    static ensureRequiredPropertiesSet(credentials, isProfile, isPasswordRequired, wasPasswordEmptyInConfigFile, prompter, connectionStore, defaultProfileValues) {
        return __awaiter(this, void 0, void 0, function* () {
            let questions = yield ConnectionCredentials.getRequiredCredentialValuesQuestions(credentials, false, isPasswordRequired, connectionStore, defaultProfileValues);
            let unprocessedCredentials = Object.assign({}, credentials);
            // Potentially ask to save password
            questions.push({
                type: question_1.QuestionTypes.confirm,
                name: LocalizedConstants.msgSavePassword,
                message: LocalizedConstants.msgSavePassword,
                shouldPrompt: (answers) => {
                    if (credentials.connectionString) {
                        return false;
                    }
                    if (isProfile) {
                        // For profiles, ask to save only if the password was prompted, and savePassword isn't set
                        return (ConnectionCredentials.shouldPromptForPassword(credentials) &&
                            typeof credentials.savePassword === "undefined");
                    }
                    else {
                        // For MRU list items, ask to save password if we are using SQL authentication and the user has not been asked before
                        return (ConnectionCredentials.isPasswordBasedCredential(credentials) &&
                            typeof credentials.savePassword === "undefined");
                    }
                },
                onAnswered: (value) => {
                    credentials.savePassword = value;
                },
            });
            return prompter.prompt(questions).then((answers) => __awaiter(this, void 0, void 0, function* () {
                if (answers) {
                    if (isProfile) {
                        let profile = credentials;
                        // If this is a profile, and the user has set save password to true and either
                        // stored the password in the config file or purposefully set an empty password,
                        // then transfer the password to the credential store
                        if (profile.savePassword &&
                            (!wasPasswordEmptyInConfigFile || profile.emptyPasswordInput)) {
                            // Remove profile, then save profile without plain text password
                            yield connectionStore.removeProfile(profile).then(() => __awaiter(this, void 0, void 0, function* () {
                                yield connectionStore.saveProfile(profile);
                            }));
                            // Or, if the user answered any additional questions for the profile, be sure to save it
                        }
                        else if (profile.authenticationType !== unprocessedCredentials.authenticationType ||
                            profile.savePassword !==
                                unprocessedCredentials.savePassword ||
                            profile.password !== unprocessedCredentials.password) {
                            if (yield connectionStore.removeProfile(profile)) {
                                yield connectionStore.saveProfile(profile);
                            }
                        }
                    }
                    return credentials;
                }
                else {
                    return undefined;
                }
            }));
        });
    }
    // gets a set of questions that ensure all required and core values are set
    static getRequiredCredentialValuesQuestions(credentials, promptForDefaults, // database, port
    isPasswordRequired, connectionStore, defaultProfileValues) {
        return __awaiter(this, void 0, void 0, function* () {
            let authenticationChoices = ConnectionCredentials.getAuthenticationTypesChoice();
            const connectionStringSet = () => (credentials.connectionString ? true : false);
            let questions = [
                // Server or connection string must be present
                {
                    type: question_1.QuestionTypes.input,
                    name: LocalizedConstants.serverPrompt,
                    message: LocalizedConstants.serverPrompt,
                    placeHolder: LocalizedConstants.serverPlaceholder,
                    default: defaultProfileValues ? defaultProfileValues.server : undefined,
                    shouldPrompt: (answers) => utils.isEmpty(credentials.server),
                    validate: (value) => ConnectionCredentials.validateRequiredString(LocalizedConstants.serverPrompt, value),
                    onAnswered: (value) => ConnectionCredentials.processServerOrConnectionString(value, credentials),
                },
                // Database name is not required, prompt is optional
                {
                    type: question_1.QuestionTypes.input,
                    name: LocalizedConstants.databasePrompt,
                    message: LocalizedConstants.databasePrompt,
                    placeHolder: LocalizedConstants.databasePlaceholder,
                    default: defaultProfileValues ? defaultProfileValues.database : undefined,
                    shouldPrompt: (answers) => !connectionStringSet() && promptForDefaults,
                    onAnswered: (value) => (credentials.database = value),
                },
                // AuthenticationType is required if there is more than 1 option on this platform
                {
                    type: question_1.QuestionTypes.expand,
                    name: LocalizedConstants.authTypeName,
                    message: LocalizedConstants.authTypePrompt,
                    choices: authenticationChoices,
                    shouldPrompt: (answers) => !connectionStringSet() &&
                        utils.isEmpty(credentials.authenticationType) &&
                        authenticationChoices.length > 1,
                    validate: (value) => {
                        if (value === utils.authTypeToString(interfaces_1.AuthenticationTypes.AzureMFA)) {
                            return undefined;
                        }
                        return undefined;
                    },
                    onAnswered: (value) => {
                        credentials.authenticationType = value;
                    },
                },
                // Username must be present
                {
                    type: question_1.QuestionTypes.input,
                    name: LocalizedConstants.usernamePrompt,
                    message: LocalizedConstants.usernamePrompt,
                    placeHolder: LocalizedConstants.usernamePlaceholder,
                    default: defaultProfileValues ? defaultProfileValues.user : undefined,
                    shouldPrompt: (answers) => !connectionStringSet() &&
                        ConnectionCredentials.shouldPromptForUser(credentials),
                    validate: (value) => ConnectionCredentials.validateRequiredString(LocalizedConstants.usernamePrompt, value),
                    onAnswered: (value) => (credentials.user = value),
                },
                // Password may or may not be necessary
                {
                    type: question_1.QuestionTypes.password,
                    name: LocalizedConstants.passwordPrompt,
                    message: LocalizedConstants.passwordPrompt,
                    placeHolder: LocalizedConstants.passwordPlaceholder,
                    shouldPrompt: (answers) => !connectionStringSet() &&
                        ConnectionCredentials.shouldPromptForPassword(credentials),
                    validate: (value) => {
                        if (isPasswordRequired) {
                            return ConnectionCredentials.validateRequiredString(LocalizedConstants.passwordPrompt, value);
                        }
                        return undefined;
                    },
                    onAnswered: (value) => {
                        if (credentials) {
                            credentials.password = value;
                            if (typeof credentials !== "undefined") {
                                credentials.emptyPasswordInput = utils.isEmpty(credentials.password);
                            }
                        }
                    },
                    default: (value) => __awaiter(this, void 0, void 0, function* () {
                        return yield connectionStore.lookupPassword(value);
                    }),
                },
            ];
            return questions;
        });
    }
    // Detect if a given value is a server name or a connection string, and assign the result accordingly
    static processServerOrConnectionString(value, credentials) {
        // If the value contains a connection string server name key, assume it is a connection string
        const dataSourceKeys = ["data source=", "server=", "address=", "addr=", "network address="];
        let isConnectionString = dataSourceKeys.some((key) => value.toLowerCase().indexOf(key) !== -1);
        if (isConnectionString) {
            credentials.connectionString = value;
        }
        else {
            credentials.server = value;
        }
    }
    static shouldPromptForUser(credentials) {
        return (utils.isEmpty(credentials.user) &&
            ConnectionCredentials.isPasswordBasedCredential(credentials));
    }
    // Prompt for password if this is a password based credential and the password for the profile was empty
    // and not explicitly set as empty. If it was explicitly set as empty, only prompt if pw not saved
    static shouldPromptForPassword(credentials) {
        return (utils.isEmpty(credentials.password) &&
            ConnectionCredentials.isPasswordBasedCredential(credentials) &&
            !credentials.emptyPasswordInput);
    }
    static isPasswordBasedCredential(credentials) {
        // TODO consider enum based verification and handling of AD auth here in the future
        let authenticationType = credentials.authenticationType;
        if (typeof credentials.authenticationType === "undefined") {
            authenticationType = utils.authTypeToString(interfaces_1.AuthenticationTypes.SqlLogin);
        }
        return authenticationType === utils.authTypeToString(interfaces_1.AuthenticationTypes.SqlLogin);
    }
    static isPasswordBasedConnectionString(connectionString) {
        const connString = connectionString.toLowerCase();
        return ((connString.includes("user") ||
            connString.includes("uid") ||
            connString.includes("userid")) &&
            (connString.includes("password") || connString.includes("pwd")) &&
            !connString.includes("Integrated Security"));
    }
    // Validates a string is not empty, returning undefined if true and an error message if not
    static validateRequiredString(property, value) {
        if (utils.isEmpty(value)) {
            return property + LocalizedConstants.msgIsRequired;
        }
        return undefined;
    }
    static getAuthenticationTypesChoice() {
        let choices = [
            {
                name: LocalizedConstants.authTypeSql,
                value: utils.authTypeToString(interfaces_1.AuthenticationTypes.SqlLogin),
            },
            {
                name: LocalizedConstants.authTypeIntegrated,
                value: utils.authTypeToString(interfaces_1.AuthenticationTypes.Integrated),
            },
            {
                name: LocalizedConstants.authTypeAzureActiveDirectory,
                value: utils.authTypeToString(interfaces_1.AuthenticationTypes.AzureMFA),
            },
        ];
        return choices;
    }
}
exports.ConnectionCredentials = ConnectionCredentials;

//# sourceMappingURL=connectionCredentials.js.map
