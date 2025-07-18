"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.isLinux = exports.Timer = void 0;
exports.generateGuid = generateGuid;
exports.generateUserId = generateUserId;
exports.isEditingSqlFile = isEditingSqlFile;
exports.getActiveTextEditor = getActiveTextEditor;
exports.getActiveTextEditorUri = getActiveTextEditorUri;
exports.logDebug = logDebug;
exports.showInfoMsg = showInfoMsg;
exports.showWarnMsg = showWarnMsg;
exports.showErrorMsg = showErrorMsg;
exports.isEmpty = isEmpty;
exports.isNotEmpty = isNotEmpty;
exports.authTypeToString = authTypeToString;
exports.azureAuthTypeToString = azureAuthTypeToString;
exports.escapeClosingBrackets = escapeClosingBrackets;
exports.formatString = formatString;
exports.isSameAccountKey = isSameAccountKey;
exports.isSameProfile = isSameProfile;
exports.isSameConnectionInfo = isSameConnectionInfo;
exports.isFileExisting = isFileExisting;
exports.parseTimeString = parseTimeString;
exports.isBoolean = isBoolean;
exports.parseNumAsTimeString = parseNumAsTimeString;
exports.getConfigTracingLevel = getConfigTracingLevel;
exports.getConfigPiiLogging = getConfigPiiLogging;
exports.getConfigLogFilesRemovalLimit = getConfigLogFilesRemovalLimit;
exports.getConfigLogRetentionSeconds = getConfigLogRetentionSeconds;
exports.removeOldLogFiles = removeOldLogFiles;
exports.getCommonLaunchArgsAndCleanupOldLogFiles = getCommonLaunchArgsAndCleanupOldLogFiles;
exports.getSignInQuickPickItems = getSignInQuickPickItems;
exports.limitStringSize = limitStringSize;
exports.generateQueryUri = generateQueryUri;
exports.deepClone = deepClone;
exports.detectPostgresProvider = detectPostgresProvider;
const getmac = require("getmac");
const crypto = require("crypto");
const os = require("os");
const path = require("path");
const findRemoveSync = require("find-remove");
const vscode = require("vscode");
const Constants = require("../constants/constants");
const interfaces_1 = require("./interfaces");
const LocalizedConstants = require("../constants/locConstants");
const fs = require("fs");
const azure_1 = require("./contracts/azure");
// CONSTANTS //////////////////////////////////////////////////////////////////////////////////////
const msInH = 3.6e6;
const msInM = 60000;
const msInS = 1000;
const configTracingLevel = "tracingLevel";
const configPiiLogging = "piiLogging";
const configLogRetentionMinutes = "logRetentionMinutes";
const configLogFilesRemovalLimit = "logFilesRemovalLimit";
// FUNCTIONS //////////////////////////////////////////////////////////////////////////////////////
// Generate a new GUID
function generateGuid() {
    let hexValues = [
        "0",
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "A",
        "B",
        "C",
        "D",
        "E",
        "F",
    ];
    // c.f. rfc4122 (UUID version 4 = xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx)
    let oct = "";
    let tmp;
    /* tslint:disable:no-bitwise */
    for (let a = 0; a < 4; a++) {
        tmp = (4294967296 * Math.random()) | 0;
        oct +=
            hexValues[tmp & 0xf] +
                hexValues[(tmp >> 4) & 0xf] +
                hexValues[(tmp >> 8) & 0xf] +
                hexValues[(tmp >> 12) & 0xf] +
                hexValues[(tmp >> 16) & 0xf] +
                hexValues[(tmp >> 20) & 0xf] +
                hexValues[(tmp >> 24) & 0xf] +
                hexValues[(tmp >> 28) & 0xf];
    }
    // 'Set the two most significant bits (bits 6 and 7) of the clock_seq_hi_and_reserved to zero and one, respectively'
    let clockSequenceHi = hexValues[(8 + Math.random() * 4) | 0];
    return (oct.substr(0, 8) +
        "-" +
        oct.substr(9, 4) +
        "-4" +
        oct.substr(13, 3) +
        "-" +
        clockSequenceHi +
        oct.substr(16, 3) +
        "-" +
        oct.substr(19, 12));
    /* tslint:enable:no-bitwise */
}
// Generate a unique, deterministic ID for the current user of the extension
function generateUserId() {
    return new Promise((resolve) => {
        try {
            getmac.getMac((error, macAddress) => {
                if (!error) {
                    resolve(crypto
                        .createHash("sha256")
                        .update(macAddress + os.homedir(), "utf8")
                        .digest("hex"));
                }
                else {
                    resolve(generateGuid()); // fallback
                }
            });
        }
        catch (err) {
            resolve(generateGuid()); // fallback
        }
    });
}
// Return 'true' if the active editor window has a .sql file, false otherwise
function isEditingSqlFile() {
    let sqlFile = false;
    let editor = getActiveTextEditor();
    if (editor) {
        if (editor.document.languageId === Constants.languageId) {
            sqlFile = true;
        }
    }
    return sqlFile;
}
// Return the active text editor if there's one
function getActiveTextEditor() {
    let editor = undefined;
    if (vscode.window && vscode.window.activeTextEditor) {
        editor = vscode.window.activeTextEditor;
    }
    return editor;
}
// Retrieve the URI for the currently open file if there is one; otherwise return the empty string
function getActiveTextEditorUri() {
    if (typeof vscode.window.activeTextEditor !== "undefined" &&
        typeof vscode.window.activeTextEditor.document !== "undefined") {
        return vscode.window.activeTextEditor.document.uri.toString(true);
    }
    return "";
}
// Helper to log debug messages
function logDebug(msg) {
    let config = vscode.workspace.getConfiguration(Constants.extensionConfigSectionName);
    let logDebugInfo = config.get(Constants.configLogDebugInfo);
    if (logDebugInfo === true) {
        let currentTime = new Date().toLocaleTimeString();
        let outputMsg = "[" + currentTime + "]: " + msg ? msg.toString() : "";
        console.log(outputMsg);
    }
}
// Helper to show an info message
function showInfoMsg(msg) {
    vscode.window.showInformationMessage(Constants.extensionName + ": " + msg);
}
// Helper to show an warn message
function showWarnMsg(msg) {
    vscode.window.showWarningMessage(Constants.extensionName + ": " + msg);
}
// Helper to show an error message
function showErrorMsg(msg) {
    vscode.window.showErrorMessage(Constants.extensionName + ": " + msg);
}
function isEmpty(str) {
    return !str || "" === str;
}
function isNotEmpty(str) {
    return (str && "" !== str);
}
function authTypeToString(value) {
    return interfaces_1.AuthenticationTypes[value];
}
function azureAuthTypeToString(value) {
    return azure_1.AzureAuthType[value];
}
function escapeClosingBrackets(str) {
    return str.replace("]", "]]");
}
/**
 * Format a string. Behaves like C#'s string.Format() function.
 */
function formatString(str, ...args) {
    // This is based on code originally from https://github.com/Microsoft/vscode/blob/master/src/vs/nls.js
    // License: https://github.com/Microsoft/vscode/blob/master/LICENSE.txt
    let result;
    if (args.length === 0) {
        result = str;
    }
    else {
        result = str.replace(/\{(\d+)\}/g, (match, rest) => {
            let index = rest[0];
            return typeof args[index] !== "undefined" ? args[index] : match;
        });
    }
    return result;
}
/**
 * Compares 2 accounts to see if they are the same.
 */
function isSameAccountKey(currentAccountKey, newAccountKey) {
    return currentAccountKey === newAccountKey;
}
/**
 * Compares 2 database names to see if they are the same.
 * If either is undefined or empty, it is assumed to be 'postgres'
 */
function isSameDatabase(currentDatabase, expectedDatabase) {
    if (isEmpty(currentDatabase)) {
        currentDatabase = Constants.defaultDatabase;
    }
    if (isEmpty(expectedDatabase)) {
        expectedDatabase = Constants.defaultDatabase;
    }
    return currentDatabase === expectedDatabase;
}
/**
 * Compares 2 port values to see if they are the same.
 * If either is undefined or empty, it is assumed to be the default port.
 * @param currentPort
 * @param expectedPort
 * @returns boolean indicating if the ports are the same
 */
function isSamePort(currentPort, expectedPort) {
    const resolvedCurrentPort = isEmpty(currentPort) ? Constants.defaultPort : currentPort;
    const resolvedExpectedPort = isEmpty(expectedPort) ? Constants.defaultPort : expectedPort;
    // Cast to string to avoid issues with ports coming through as either type
    return resolvedCurrentPort.toString() === resolvedExpectedPort.toString();
}
/**
 * Compares 2 authentication type strings to see if they are the same.
 * If either is undefined or empty, then it is assumed to be SQL authentication by default.
 */
function isSameAuthenticationType(currentAuthenticationType, expectedAuthenticationType) {
    if (isEmpty(currentAuthenticationType)) {
        currentAuthenticationType = Constants.sqlAuthentication;
    }
    if (isEmpty(expectedAuthenticationType)) {
        expectedAuthenticationType = Constants.sqlAuthentication;
    }
    return currentAuthenticationType === expectedAuthenticationType;
}
/**
 * Compares 2 profiles to see if they match. Logic for matching:
 * If a profile name is used, can simply match on this.
 * If not, match on all key properties (server, db, auth type, user) being identical.
 * Other properties are ignored for this purpose
 *
 * @param currentProfile the profile to check
 * @param expectedProfile the profile to try
 * @returns boolean that is true if the profiles match
 */
function isSameProfile(currentProfile, expectedProfile) {
    if (currentProfile.id && expectedProfile.id) {
        return currentProfile.id === expectedProfile.id;
    }
    if (currentProfile === undefined) {
        return false;
    }
    if (expectedProfile.profileName) {
        // Can match on profile name
        return expectedProfile.profileName === currentProfile.profileName;
    }
    else if (currentProfile.profileName) {
        // This has a profile name but expected does not - can break early
        return false;
    }
    else if (currentProfile.connectionString || expectedProfile.connectionString) {
        // If either profile uses connection strings, compare them directly
        return currentProfile.connectionString === expectedProfile.connectionString;
    }
    else if (currentProfile.authenticationType === Constants.azureMfa &&
        expectedProfile.authenticationType === Constants.azureMfa) {
        return (expectedProfile.server === currentProfile.server &&
            isSameDatabase(expectedProfile.database, currentProfile.database) &&
            isSameAccountKey(
            // @ts-ignore
            expectedProfile.accountId, 
            // @ts-ignore
            currentProfile.accountId));
    }
    return (expectedProfile.server === currentProfile.server &&
        isSameDatabase(expectedProfile.database, currentProfile.database) &&
        isSameAuthenticationType(expectedProfile.authenticationType, currentProfile.authenticationType) &&
        ((isEmpty(expectedProfile.user) && isEmpty(currentProfile.user)) ||
            expectedProfile.user === currentProfile.user));
}
/**
 * Compares 2 connections to see if they match. Logic for matching: match on all
 * key properties (server, port, db, auth type, user) being identical. Other
 * properties are ignored for this purpose.
 *
 * @param conn the connection to check
 * @param expectedConn the connection to try to match
 * @param checkId whether to use the connection id in the check. Set to false if you actually
 * want to check the connection id properties for similarity
 * @returns boolean that is true if the connections match
 */
function isSameConnectionInfo(conn, expectedConn, checkId = true) {
    const connId = conn.id;
    const expectedConnId = expectedConn.id;
    if (connId && expectedConnId && checkId) {
        return connId === expectedConnId;
    }
    const bothAzureMfa = expectedConn.authenticationType === Constants.azureMfa &&
        conn.authenticationType === Constants.azureMfa;
    if (bothAzureMfa) {
        // Azure MFA connections
        return (expectedConn.server === conn.server &&
            isSamePort(expectedConn.port, conn.port) &&
            isSameDatabase(expectedConn.database, conn.database) &&
            isSameAccountKey(expectedConn.accountId, conn.accountId));
    }
    else {
        // Non-Azure MFA connections
        const authenticationMatches = isSameAuthenticationType(expectedConn.authenticationType, conn.authenticationType);
        const userMatches = conn.authenticationType === Constants.sqlAuthentication
            ? conn.user === expectedConn.user
            : isEmpty(conn.user) === isEmpty(expectedConn.user);
        return (expectedConn.server === conn.server &&
            isSameDatabase(expectedConn.database, conn.database) &&
            isSamePort(expectedConn.port, conn.port) &&
            authenticationMatches &&
            userMatches);
    }
}
/**
 * Check if a file exists on disk
 */
function isFileExisting(filePath) {
    try {
        fs.statSync(filePath);
        return true;
    }
    catch (err) {
        return false;
    }
}
// One-time use timer for performance testing
class Timer {
    constructor() {
        this.start();
    }
    // Get the duration of time elapsed by the timer, in milliseconds
    getDuration() {
        if (!this._startTime) {
            return -1;
        }
        else if (!this._endTime) {
            let endTime = process.hrtime(this._startTime);
            return endTime[0] * 1000 + endTime[1] / 1000000;
        }
        else {
            return this._endTime[0] * 1000 + this._endTime[1] / 1000000;
        }
    }
    start() {
        this._startTime = process.hrtime();
    }
    end() {
        if (!this._endTime) {
            this._endTime = process.hrtime(this._startTime);
        }
    }
}
exports.Timer = Timer;
/**
 * Takes a string in the format of HH:MM:SS.MS and returns a number representing the time in
 * miliseconds
 * @param value The string to convert to milliseconds
 * @return False is returned if the string is an invalid format,
 *         the number of milliseconds in the time string is returned otherwise.
 */
function parseTimeString(value) {
    if (!value) {
        return false;
    }
    let tempVal = value.split(".");
    if (tempVal.length === 1) {
        // Ideally would handle more cleanly than this but for now handle case where ms not set
        tempVal = [tempVal[0], "0"];
    }
    else if (tempVal.length !== 2) {
        return false;
    }
    let msString = tempVal[1];
    let msStringEnd = msString.length < 3 ? msString.length : 3;
    let ms = parseInt(tempVal[1].substring(0, msStringEnd), 10);
    tempVal = tempVal[0].split(":");
    if (tempVal.length !== 3) {
        return false;
    }
    let h = parseInt(tempVal[0], 10);
    let m = parseInt(tempVal[1], 10);
    let s = parseInt(tempVal[2], 10);
    return ms + h * msInH + m * msInM + s * msInS;
}
function isBoolean(obj) {
    return obj === true || obj === false;
}
/**
 * Takes a number of milliseconds and converts it to a string like HH:MM:SS.fff
 * @param value The number of milliseconds to convert to a timespan string
 * @returns A properly formatted timespan string.
 */
function parseNumAsTimeString(value) {
    let tempVal = value;
    let h = Math.floor(tempVal / msInH);
    tempVal %= msInH;
    let m = Math.floor(tempVal / msInM);
    tempVal %= msInM;
    let s = Math.floor(tempVal / msInS);
    tempVal %= msInS;
    let hs = h < 10 ? "0" + h : "" + h;
    let ms = m < 10 ? "0" + m : "" + m;
    let ss = s < 10 ? "0" + s : "" + s;
    let mss = tempVal < 10 ? "00" + tempVal : tempVal < 100 ? "0" + tempVal : "" + tempVal;
    let rs = hs + ":" + ms + ":" + ss;
    return tempVal > 0 ? rs + "." + mss : rs;
}
function getConfiguration() {
    return vscode.workspace.getConfiguration(Constants.extensionConfigSectionName);
}
function getConfigTracingLevel() {
    let config = getConfiguration();
    if (config) {
        return config.get(configTracingLevel);
    }
    else {
        return undefined;
    }
}
function getConfigPiiLogging() {
    let config = getConfiguration();
    if (config) {
        return config.get(configPiiLogging);
    }
    else {
        return undefined;
    }
}
function getConfigLogFilesRemovalLimit() {
    let config = getConfiguration();
    if (config) {
        return Number(config.get(configLogFilesRemovalLimit, 0).toFixed(0));
    }
    else {
        return undefined;
    }
}
function getConfigLogRetentionSeconds() {
    let config = getConfiguration();
    if (config) {
        return Number((config.get(configLogRetentionMinutes, 0) * 60).toFixed(0));
    }
    else {
        return undefined;
    }
}
function removeOldLogFiles(logPath, prefix) {
    return findRemoveSync(logPath, {
        age: { seconds: getConfigLogRetentionSeconds() },
        limit: getConfigLogFilesRemovalLimit(),
    });
}
function getCommonLaunchArgsAndCleanupOldLogFiles(executablePath, logPath, fileName) {
    let launchArgs = [];
    launchArgs.push("--log-file");
    let logFile = path.join(logPath, fileName);
    launchArgs.push(logFile);
    console.log(`logFile for ${path.basename(executablePath)} is ${logFile}`);
    // Delete old log files
    let deletedLogFiles = removeOldLogFiles(logPath, fileName);
    console.log(`Old log files deletion report: ${JSON.stringify(deletedLogFiles)}`);
    console.log(`This process (ui Extenstion Host) for ${path.basename(executablePath)} is pid: ${process.pid}`);
    launchArgs.push("--tracing-level");
    launchArgs.push(getConfigTracingLevel());
    if (getConfigPiiLogging()) {
        launchArgs.push("--pii-logging");
    }
    return launchArgs;
}
/**
 * Returns the all the sign in methods as quickpick items
 */
function getSignInQuickPickItems() {
    let signInItem = {
        label: LocalizedConstants.azureSignIn,
        description: LocalizedConstants.azureSignInDescription,
        command: Constants.cmdAzureSignIn,
    };
    let signInWithDeviceCode = {
        label: LocalizedConstants.azureSignInWithDeviceCode,
        description: LocalizedConstants.azureSignInWithDeviceCodeDescription,
        command: Constants.cmdAzureSignInWithDeviceCode,
    };
    let signInAzureCloud = {
        label: LocalizedConstants.azureSignInToAzureCloud,
        description: LocalizedConstants.azureSignInToAzureCloudDescription,
        command: Constants.cmdAzureSignInToCloud,
    };
    return [signInItem, signInWithDeviceCode, signInAzureCloud];
}
/**
 * Limits the size of a string with ellipses in the middle
 */
function limitStringSize(input, forCommandPalette = false) {
    if (!forCommandPalette) {
        if (input.length > 45) {
            return `${input.substr(0, 20)}...${input.substr(input.length - 20, input.length)}`;
        }
    }
    else {
        if (input.length > 100) {
            return `${input.substr(0, 45)}...${input.substr(input.length - 45, input.length)}`;
        }
    }
    return input;
}
let uriIndex = 0;
/**
 * Generates a URI intended for use when running queries if a file connection isn't present (such
 * as when running ad-hoc queries).
 */
function generateQueryUri(scheme = "vscode-mssql-adhoc") {
    return vscode.Uri.from({
        scheme: scheme,
        authority: `Query${uriIndex++}`,
    });
}
/**
 * deep clone the object. Copied from vscode: https://github.com/microsoft/vscode/blob/main/src/vs/base/common/objects.ts#L8
 */
function deepClone(obj) {
    if (!obj || typeof obj !== "object") {
        return obj;
    }
    if (obj instanceof RegExp) {
        // See https://github.com/microsoft/TypeScript/issues/10990
        return obj;
    }
    const result = Array.isArray(obj) ? [] : {};
    Object.keys(obj).forEach((key) => {
        if (obj[key] && typeof obj[key] === "object") {
            result[key] = deepClone(obj[key]);
        }
        else {
            result[key] = obj[key];
        }
    });
    return result;
}
exports.isLinux = os.platform() === "linux";
function detectPostgresProvider(hostname) {
    // List of known domain substrings (usually suffixes) mapped to provider names
    const providerDomains = {
        "amazonaws.com": "AWS", // Amazon RDS (includes Aurora)
        "azure.com": "Azure", // Azure Database
        "aliyuncs.com": "Alibaba Cloud", // Alibaba Cloud ApsaraDB for PostgreSQL
        "ondigitalocean.com": "DigitalOcean", // DigitalOcean Managed Databases
        "supabase.co": "Supabase", // Supabase Database (direct connection)
        "supabase.com": "Supabase", // Supabase (connection pooler)
        "neon.tech": "Neon", // Neon serverless Postgres
        "postgresbridge.com": "CrunchyData", // Crunchy Data (Crunchy Bridge)
        "elephantsql.com": "ElephantSQL", // ElephantSQL service
        "aivencloud.com": "Aiven", // Aiven managed PostgreSQL
        "rlwy.net": "Railway", // Railway Postgres database (proxy)
        "railway.app": "Railway", // Railway (alternative domain, if any)
        "databases.appdomain.cloud": "IBM Cloud", // IBM Cloud Databases for PostgreSQL
        "timescale.com": "Timescale", // Timescale Cloud (Managed TimescaleDB)
        "scalegrid.io": "ScaleGrid", // ScaleGrid managed PostgreSQL
        // eslint-disable-next-line prettier/prettier
        localhost: "Local", // Localhost (not a managed provider)
        // Note: Heroku Postgres uses AWS hostnames (amazonaws.com) &  which will be classified as AWS by the check below.
        // GCP uses IP addresses and does not have a specific domain suffix.
    };
    // Check if the hostname ends with any of the known domain suffixes
    for (const suffix in providerDomains) {
        if (hostname.toLowerCase().endsWith(suffix)) {
            return providerDomains[suffix];
        }
    }
    // Helper regexes
    const ipv4Regex = /^(?:\d{1,3}\.){3}\d{1,3}$/;
    const ipv6Regex = /^(?:[a-fA-F0-9]{0,4}:){2,7}[a-fA-F0-9]{0,4}$/;
    const privateIPv4Regex = /^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.)/;
    const tldRegex = /\.[a-zA-Z]{2,}$/;
    const localNetworkRegex = /\.(local|lan|internal)$/i;
    if (ipv4Regex.test(hostname)) {
        if (privateIPv4Regex.test(hostname)) {
            return "IPv4-Private";
        }
        return "IPv4";
    }
    if (ipv6Regex.test(hostname)) {
        return "IPv6";
    }
    // Check for local network hostnames
    if (localNetworkRegex.test(hostname)) {
        return "LocalNetwork";
    }
    // Check for single-label hostnames (no dots)
    if (!hostname.includes(".")) {
        return "SingleLabel";
    }
    // Check for TLD (Internet, but not a known provider)
    if (tldRegex.test(hostname)) {
        return "Internet-other";
    }
    return "Unknown"; // Not a recognized managed PostgreSQL provider
}

//# sourceMappingURL=utils.js.map
