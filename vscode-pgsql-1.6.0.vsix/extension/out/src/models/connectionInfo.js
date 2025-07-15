"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.fixupConnectionProfile = fixupConnectionProfile;
exports.updateEncrypt = updateEncrypt;
exports.getSimpleConnectionDisplayName = getSimpleConnectionDisplayName;
exports.getPicklistDescription = getPicklistDescription;
exports.getPicklistDetails = getPicklistDetails;
exports.getConnectionDisplayString = getConnectionDisplayString;
exports.getUserNameOrDomainLogin = getUserNameOrDomainLogin;
exports.getTooltip = getTooltip;
exports.getEncryptionMode = getEncryptionMode;
exports.getConnectionDisplayName = getConnectionDisplayName;
exports.getConnectionShortName = getConnectionShortName;
const Constants = require("../constants/constants");
const LocalizedConstants = require("../constants/locConstants");
const interfaces_1 = require("../models/interfaces");
const Interfaces = require("./interfaces");
const Utils = require("./utils");
/**
 * Sets sensible defaults for key connection properties, especially
 * if connection to Azure
 *
 * @export connectionInfo/fixupConnectionProfile
 * @param connCreds connection to be fixed up
 * @returns the updated connection
 */
function fixupConnectionProfile(profile) {
    if (!profile.server) {
        profile.server = "";
    }
    if (!profile.database) {
        profile.database = "";
    }
    if (!profile.user) {
        profile.user = "";
    }
    if (profile.authenticationType === "SqlLogin" /* AuthenticationType.SqlLogin */ &&
        !profile.password &&
        !profile.savePassword) {
        profile.password = "";
        profile.emptyPasswordInput = true;
    }
    if (!profile.connectTimeout) {
        profile.connectTimeout = Constants.defaultConnectionTimeout;
    }
    // default value for appName
    if (!profile.applicationName) {
        profile.applicationName = Constants.connectionApplicationName;
    }
    return profile;
}
function updateEncrypt(connection) {
    let updatePerformed = true;
    let resultConnection = Object.assign({}, connection);
    if (connection.encrypt === true) {
        resultConnection.encrypt = interfaces_1.EncryptOptions.Mandatory;
    }
    else if (connection.encrypt === false) {
        resultConnection.encrypt = interfaces_1.EncryptOptions.Optional;
    }
    else {
        updatePerformed = false;
    }
    return { connection: resultConnection, updateStatus: updatePerformed };
}
/**
 * Gets a label describing a connection in the picklist UI
 *
 * @export connectionInfo/getPicklistLabel
 * @param connection connection to create a label for
 * @param itemType type of quickpick item to display - this influences the icon shown to the user
 * @returns user readable label
 */
function getSimpleConnectionDisplayName(connection) {
    let profile = connection;
    if (profile.profileName) {
        return profile.profileName;
    }
    else {
        return connection.server ? connection.server : connection.connectionString;
    }
}
/**
 * Gets a description for a connection to display in the picklist UI
 *
 * @export connectionInfo/getPicklistDescription
 * @param connCreds connection
 * @returns description
 */
function getPicklistDescription(connCreds) {
    let desc = `[${getConnectionDisplayString(connCreds)}]`;
    return desc;
}
/**
 * Gets detailed information about a connection, which can be displayed in the picklist UI
 *
 * @export connectionInfo/getPicklistDetails
 * @param connCreds connection
 * @returns details
 */
function getPicklistDetails(connCreds) {
    // In the current spec this is left empty intentionally. Leaving the method as this may change in the future
    return undefined;
}
/**
 * Gets a display string for a connection. This is a concise version of the connection
 * information that can be shown in a number of different UI locations
 *
 * @export connectionInfo/getConnectionDisplayString
 * @param conn connection
 * @returns display string that can be used in status view or other locations
 */
function getConnectionDisplayString(creds, isStatusView = false) {
    // Update the connection text
    let text = isStatusView ? `🟢 ${creds.server}` : creds.server;
    if (creds.port) {
        text += `:${creds.port}`;
    }
    text += `/${creds.database || LocalizedConstants.defaultDatabaseLabel}`;
    let user = getUserNameOrDomainLogin(creds);
    text = appendIfNotEmpty(text, user);
    // Limit the maximum length of displayed text
    if (text && text.length > Constants.maxDisplayedStatusTextLength) {
        text = text.substr(0, Constants.maxDisplayedStatusTextLength);
        text += " \u2026"; // Ellipsis character (...)
    }
    return text;
}
function appendIfNotEmpty(connectionText, value) {
    if (Utils.isNotEmpty(value)) {
        connectionText += ` : ${value}`;
    }
    return connectionText;
}
/**
 * Gets a formatted display version of a username, or the domain user if using Integrated authentication
 *
 * @export connectionInfo/getUserNameOrDomainLogin
 * @param conn connection
 * @param [defaultValue] optional default value to use if username is empty and this is not an Integrated auth profile
 * @returns
 */
function getUserNameOrDomainLogin(creds, defaultValue) {
    if (!defaultValue) {
        defaultValue = "";
    }
    if (creds.authenticationType ===
        Interfaces.AuthenticationTypes[Interfaces.AuthenticationTypes.Integrated]) {
        return process.platform === "win32"
            ? process.env.USERDOMAIN + "\\" + process.env.USERNAME
            : "";
    }
    else {
        return creds.user ? creds.user : defaultValue;
    }
}
/**
 * Gets a detailed tooltip with information about a connection
 *
 * @export connectionInfo/getTooltip
 * @param connCreds connection
 * @returns tooltip
 */
function getTooltip(connCreds, serverInfo) {
    let tooltip = "Host: " +
        connCreds.server +
        (connCreds.port ? ":" + connCreds.port : "") +
        "\r\n" +
        "Database: " +
        (connCreds.database ? connCreds.database : LocalizedConstants.defaultDatabaseLabel) +
        "\r\n" +
        "User: " +
        connCreds.user +
        "\r\n";
    if (serverInfo && serverInfo.serverVersion) {
        tooltip += "Server version: " + serverInfo.serverVersion + "\r\n";
    }
    return tooltip;
}
function getEncryptionMode(encryption) {
    let encryptionMode = interfaces_1.EncryptOptions.Mandatory;
    if (encryption !== undefined) {
        let encrypt = encryption.toString().toLowerCase();
        switch (encrypt) {
            case "true":
            case interfaces_1.EncryptOptions.Mandatory.toLowerCase():
                encryptionMode = interfaces_1.EncryptOptions.Mandatory;
                break;
            case "false":
            case interfaces_1.EncryptOptions.Optional.toLowerCase():
                encryptionMode = interfaces_1.EncryptOptions.Optional;
                break;
            case interfaces_1.EncryptOptions.Strict.toLowerCase():
                encryptionMode = interfaces_1.EncryptOptions.Strict;
                break;
            default:
                break;
        }
    }
    return encryptionMode;
}
function getConnectionDisplayName(credentials) {
    let database = credentials.database;
    const server = credentials.server;
    const authType = credentials.authenticationType;
    let userOrAuthType = authType;
    if (authType === Constants.sqlAuthentication) {
        userOrAuthType = credentials.user;
    }
    if (authType === Constants.azureMfa) {
        userOrAuthType =
            credentials.entraUserName || credentials.email;
    }
    if (!database || database === "") {
        database = LocalizedConstants.defaultDatabaseLabel;
    }
    return `${server}, ${database} (${userOrAuthType})`;
}
function getConnectionShortName(credentials) {
    let database = credentials.database;
    const server = credentials.server;
    if (!database || database === "") {
        database = LocalizedConstants.defaultDatabaseLabel;
    }
    return `${server}/${database}`;
}

//# sourceMappingURL=connectionInfo.js.map
