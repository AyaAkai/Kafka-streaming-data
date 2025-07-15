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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.azureSubscriptionFilterConfigKey = void 0;
exports.confirmVscodeAzureSignin = confirmVscodeAzureSignin;
exports.promptForAzureSubscriptionFilter = promptForAzureSubscriptionFilter;
exports.getQuickPickItems = getQuickPickItems;
exports.fetchServersFromAzure = fetchServersFromAzure;
exports.fetchDatabasesForServerFromAzure = fetchDatabasesForServerFromAzure;
exports.getAccounts = getAccounts;
exports.getTenants = getTenants;
const vscode = require("vscode");
const vscode_1 = require("vscode");
const vscode_azext_azureauth_1 = require("@microsoft/vscode-azext-azureauth");
const arm_resources_1 = require("@azure/arm-resources");
const arm_postgresql_flexible_1 = require("@azure/arm-postgresql-flexible");
const constants_1 = require("../constants/constants");
const telemetry_1 = require("../sharedInterfaces/telemetry");
const telemetry_2 = require("../telemetry/telemetry");
const utils_1 = require("../utils/utils");
exports.azureSubscriptionFilterConfigKey = "azureResourceGroups.selectedSubscriptions";
//#region VS Code integration
function confirmVscodeAzureSignin() {
    return __awaiter(this, void 0, void 0, function* () {
        const auth = new vscode_azext_azureauth_1.VSCodeAzureSubscriptionProvider();
        if (!(yield auth.isSignedIn())) {
            const result = yield auth.signIn();
            if (!result) {
                return undefined;
            }
        }
        return auth;
    });
}
function promptForAzureSubscriptionFilter(state) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const auth = yield confirmVscodeAzureSignin();
            if (!auth) {
                state.formError = vscode_1.l10n.t("Azure sign in failed.");
                return;
            }
            const selectedSubs = yield vscode.window.showQuickPick(getQuickPickItems(auth), {
                canPickMany: true,
                ignoreFocusOut: true,
                placeHolder: vscode_1.l10n.t("Select subscriptions"),
            });
            if (!selectedSubs) {
                return;
            }
            yield vscode.workspace.getConfiguration().update(exports.azureSubscriptionFilterConfigKey, selectedSubs.map((s) => `${s.tenantId}/${s.subscriptionId}`), vscode.ConfigurationTarget.Global);
        }
        catch (error) {
            state.formError = vscode_1.l10n.t("Error loading Azure subscriptions.");
            console.error(state.formError + "\n" + (0, utils_1.getErrorMessage)(error));
            return;
        }
    });
}
function getQuickPickItems(auth) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const allSubs = yield auth.getSubscriptions(false /* don't use the current filter, 'cause we're gonna set it */);
        const prevSelectedSubs = (_a = vscode.workspace
            .getConfiguration()
            .get(exports.azureSubscriptionFilterConfigKey)) === null || _a === void 0 ? void 0 : _a.map((entry) => entry.split("/")[1]);
        const quickPickItems = allSubs
            .map((sub) => {
            return {
                label: `${sub.name} (${sub.subscriptionId})`,
                tenantId: sub.tenantId,
                subscriptionId: sub.subscriptionId,
                picked: prevSelectedSubs ? prevSelectedSubs.includes(sub.subscriptionId) : true,
            };
        })
            .sort((a, b) => a.label.localeCompare(b.label));
        return quickPickItems;
    });
}
const serverResourceType = "Microsoft.DBforPostgreSQL/flexibleServers";
function fetchServersFromAzure(sub) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = [];
        const client = new arm_resources_1.ResourceManagementClient(sub.credential, sub.subscriptionId);
        const servers = yield (0, utils_1.listAllIterator)(client.resources.list({
            filter: `resourceType eq '${serverResourceType}'`,
        }));
        for (const server of servers) {
            result.push({
                server: server.name,
                location: server.location,
                resourceGroup: extractFromResourceId(server.id, "resourceGroups"),
                subscription: `${sub.name} (${sub.subscriptionId})`,
            });
        }
        return result;
    });
}
function fetchDatabasesForServerFromAzure(sub, resourceGroup, serverName) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, e_1, _b, _c;
        var _d, _e, _f;
        const postgresClient = new arm_postgresql_flexible_1.PostgreSQLManagementFlexibleServerClient(sub.credential, sub.subscriptionId);
        const databases = [];
        try {
            for (var _g = true, _h = __asyncValues(postgresClient.databases.listByServer(resourceGroup, serverName)), _j; _j = yield _h.next(), _a = _j.done, !_a; _g = true) {
                _c = _j.value;
                _g = false;
                const database = _c;
                if (!constants_1.AzurePostgresSysDatabases.includes(database.name)) {
                    databases.push({
                        id: (_d = database.id) !== null && _d !== void 0 ? _d : "",
                        name: (_e = database.name) !== null && _e !== void 0 ? _e : "",
                        type: (_f = database.type) !== null && _f !== void 0 ? _f : "",
                    });
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (!_g && !_a && (_b = _h.return)) yield _b.call(_h);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return databases;
    });
}
//#endregion
//#region Azure Entra auth helpers
function getAccounts(azureAccountService) {
    return __awaiter(this, void 0, void 0, function* () {
        let accounts = [];
        try {
            accounts = yield azureAccountService.getAccounts();
            return accounts.map((account) => {
                return {
                    displayName: account.displayInfo.displayName,
                    value: account.displayInfo.userId,
                };
            });
        }
        catch (error) {
            console.error(`Error loading Azure accounts: ${(0, utils_1.getErrorMessage)(error)}`);
            (0, telemetry_2.sendErrorEvent)(telemetry_1.TelemetryViews.ConnectionDialog, telemetry_1.TelemetryActions.LoadAzureAccountsForEntraAuth, error, false, // includeErrorMessage
            undefined, // errorCode
            undefined, // errorType
            undefined, // additionalProperties
            {
                accountCount: accounts.length,
                undefinedAccountCount: accounts.filter((x) => x === undefined).length,
                undefinedDisplayInfoCount: accounts.filter((x) => x !== undefined && x.displayInfo === undefined).length,
            });
            return [];
        }
    });
}
function getTenants(azureAccountService, accountId) {
    return __awaiter(this, void 0, void 0, function* () {
        let tenants = [];
        try {
            const account = (yield azureAccountService.getAccounts()).find((account) => { var _a; return ((_a = account.displayInfo) === null || _a === void 0 ? void 0 : _a.userId) === accountId; });
            if (!account) {
                return [];
            }
            tenants = account.properties.tenants;
            if (!tenants) {
                return [];
            }
            return tenants.map((tenant) => {
                return {
                    displayName: tenant.displayName,
                    value: tenant.id,
                };
            });
        }
        catch (error) {
            console.error(`Error loading Azure tenants: ${(0, utils_1.getErrorMessage)(error)}`);
            (0, telemetry_2.sendErrorEvent)(telemetry_1.TelemetryViews.ConnectionDialog, telemetry_1.TelemetryActions.LoadAzureTenantsForEntraAuth, error, false, // includeErrorMessage
            undefined, // errorCode
            undefined, // errorType
            undefined, // additionalProperties
            {
                tenant: tenants.length,
                undefinedTenantCount: tenants.filter((x) => x === undefined).length,
            });
            return [];
        }
    });
}
//#endregion
//#region Miscellaneous Auzre helpers
function extractFromResourceId(resourceId, property) {
    if (!property.endsWith("/")) {
        property += "/";
    }
    let startIndex = resourceId.indexOf(property);
    if (startIndex === -1) {
        return undefined;
    }
    else {
        startIndex += property.length;
    }
    return resourceId.substring(startIndex, resourceId.indexOf("/", startIndex));
}
//#endregion

//# sourceMappingURL=azureHelpers.js.map
