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
exports.ConnectionConfig = void 0;
const Constants = require("../constants/constants");
const Utils = require("../models/utils");
const vscodeWrapper_1 = require("../controllers/vscodeWrapper");
const protocol_1 = require("../protocol");
const connectionProfile_1 = require("../models/connectionProfile");
const logger_1 = require("../models/logger");
const connectionInfo_1 = require("../models/connectionInfo");
const serverGroupManager_1 = require("./serverGroupManager");
const connectionDialog_1 = require("../sharedInterfaces/connectionDialog");
/**
 * Implements connection profile file storage.
 */
class ConnectionConfig {
    /**
     * Constructor.
     */
    constructor(_vscodeWrapper) {
        this._vscodeWrapper = _vscodeWrapper;
        this.initialized = new protocol_1.Deferred();
        if (!this._vscodeWrapper) {
            this._vscodeWrapper = new vscodeWrapper_1.default();
        }
        this._logger = logger_1.Logger.create(this._vscodeWrapper.outputChannel, "ConnectionConfig");
        this._serverGroupMgr = serverGroupManager_1.ServerGroupManager.getInstance();
        void this.assignMissingProperties();
    }
    /**
     * Ensure that all connection profiles have required properties, including
     * an ID and a groupId. If a groupId is defined in a connection, but
     * missing from groups, add it to the list of groups. There must always be a
     * default group.
     */
    assignMissingProperties() {
        return __awaiter(this, void 0, void 0, function* () {
            const missingGroupIds = new Set();
            let madeProfileChanges = false;
            const profiles = this.getProfilesFromSettings();
            for (const profile of profiles) {
                // ensure each profile has an ID
                if (connectionProfile_1.ConnectionProfile.addIdIfMissing(profile)) {
                    madeProfileChanges = true;
                    this._logger.logDebug(`Adding missing ID to connection '${(0, connectionInfo_1.getConnectionDisplayName)(profile)}'`);
                }
                // Old extension migration: host -> server
                // @ts-ignore: Ignoring host (old extension prop) property error
                if (profile.host && !profile.server) {
                    // @ts-ignore: Ignoring host (old extension prop) property error
                    profile.server = profile.host;
                    madeProfileChanges = true;
                    this._logger.logDebug(`Adding missing groupId to connection '${(0, connectionInfo_1.getConnectionDisplayName)(profile)}'`);
                }
                // Old extension migration: dbname -> database
                // @ts-ignore: Ignoring dbname (old extension prop) property error
                if (profile.dbname && !profile.database) {
                    // @ts-ignore: Ignoring dbname (old extension prop) property error
                    profile.database = profile.dbname;
                    madeProfileChanges = true;
                    this._logger.logDebug(`Adding missing groupId to connection '${(0, connectionInfo_1.getConnectionDisplayName)(profile)}'`);
                }
                // Old extension migration: ensure profile has a profile/connection name
                if (!profile.profileName) {
                    const defaultProfileName = (0, connectionInfo_1.getConnectionDisplayName)(profile);
                    profile.profileName = defaultProfileName;
                    madeProfileChanges = true;
                    this._logger.logDebug(`Adding missing connection name to connection '${(0, connectionInfo_1.getConnectionDisplayName)(profile)}'`);
                }
                // Previous connections may have AzureMFA but not set the
                // entraUserName field. Move email value to entraUserName if it is
                // empty.
                if (profile.authenticationType === connectionDialog_1.AuthenticationType.AzureMFA &&
                    !profile.entraUserName &&
                    profile.email) {
                    profile.entraUserName = profile.email;
                    madeProfileChanges = true;
                    this._logger.logDebug(`Adding missing entraUserName to connection '${(0, connectionInfo_1.getConnectionDisplayName)(profile)}'`);
                }
                // ensure each profile is in a group
                if (!profile.groupId) {
                    const defaultGroup = yield this._serverGroupMgr.getDefaultGroup();
                    profile.groupId = defaultGroup.id;
                    madeProfileChanges = true;
                    this._logger.logDebug(`Adding missing groupId to connection '${(0, connectionInfo_1.getConnectionDisplayName)(profile)}'`);
                }
                if (!this._serverGroupMgr.groupExists(profile.groupId)) {
                    // if the groupId is missing, add it to the set of missing groupIds
                    missingGroupIds.add(profile.groupId);
                }
            }
            yield this._serverGroupMgr.addMissingGroups(missingGroupIds);
            // Save the changes to settings
            if (madeProfileChanges) {
                this._logger.logDebug(`Updates made to connection profiles. Writing ${profiles.length} profile(s) to settings.`);
                yield this.writeProfilesToSettings(profiles);
            }
            this.initialized.resolve();
        });
    }
    /**
     * Add a new connection to the connection config.
     */
    addConnection(profile) {
        return __awaiter(this, void 0, void 0, function* () {
            if (profile.groupId === undefined) {
                const group = yield this._serverGroupMgr.getDefaultGroup();
                profile.groupId = group.id;
            }
            let profiles = this.getProfilesFromSettings();
            // Remove the profile if already set
            profiles = profiles.filter((value) => !Utils.isSameProfile(value, profile));
            profiles.push(profile);
            return yield this.writeProfilesToSettings(profiles);
        });
    }
    /**
     * Get a list of all connections in the connection config. Connections returned
     * are sorted first by whether they were found in the user/workspace settings,
     * and next alphabetically by profile/server name.
     */
    getConnections(getWorkspaceConnections) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.initialized;
            let profiles = [];
            // Read from user settings
            let userProfiles = this.getProfilesFromSettings();
            userProfiles.sort(this.compareConnectionProfile);
            profiles = profiles.concat(userProfiles);
            if (getWorkspaceConnections) {
                // Read from workspace settings
                let workspaceProfiles = this.getProfilesFromSettings(false);
                workspaceProfiles.sort(this.compareConnectionProfile);
                profiles = profiles.concat(workspaceProfiles);
            }
            const validProfiles = this.validateProfiles(profiles);
            return validProfiles;
        });
    }
    /**
     * Validate the connection profiles. Drop any that do not have requisite properties
     * Corresponds to the required properties in assignMissingProperties.
     * @param profiles the list of profiles to validate.
     * @returns the list of valid profiles.
     */
    validateProfiles(profiles) {
        const validProfiles = [];
        for (const profile of profiles) {
            const missingProps = [];
            // Check for required properties as in assignMissingProperties
            if (!profile.id) {
                missingProps.push("id");
            }
            if (!profile.groupId) {
                missingProps.push("groupId");
            }
            if (!profile.profileName) {
                missingProps.push("profileName");
            }
            if (!profile.user) {
                missingProps.push("user");
            }
            if (profile.authenticationType === connectionDialog_1.AuthenticationType.AzureMFA &&
                !profile.entraUserName) {
                missingProps.push("entraUserName");
            }
            if (!profile.server) {
                missingProps.push("server or connectionString");
            }
            if (missingProps.length === 0) {
                validProfiles.push(profile);
            }
            else {
                const name = profile.profileName || profile.id || profile.server || "<unknown>";
                this._logger.logDebug(`Failed to import profile: Profile '${name}' is missing required properties: ${missingProps.join(", ")}`);
            }
        }
        return validProfiles;
    }
    /**
     * Remove an existing connection from the connection config.
     */
    removeConnection(profile) {
        return __awaiter(this, void 0, void 0, function* () {
            let profiles = this.getProfilesFromSettings();
            // Remove the profile if already set
            let found = false;
            profiles = profiles.filter((value) => {
                if (Utils.isSameProfile(value, profile)) {
                    // remove just this profile
                    found = true;
                    return false;
                }
                else {
                    return true;
                }
            });
            yield this.writeProfilesToSettings(profiles);
            return found;
        });
    }
    /**
     * Update an existing connection in the connection config. The id must
     * remain the same.
     * @param updatedProfile the updated connection profile.
     * @returns a promise that resolves when the update is complete.
     */
    updateConnection(updatedProfile) {
        return __awaiter(this, void 0, void 0, function* () {
            let profiles = this.getProfilesFromSettings();
            // Remove the old profile if already set
            profiles = profiles.filter((p) => p.id !== updatedProfile.id);
            profiles.push(updatedProfile);
            yield this.writeProfilesToSettings(profiles);
        });
    }
    /**
     * Get all profiles from the settings.
     * This is public for testing only.
     * @param global When `true` profiles come from user settings, otherwise from workspace settings.  Default is `true`.
     * @returns the set of connection profiles found in the settings.
     */
    getProfilesFromSettings(global = true) {
        return this.getArrayFromSettings(Constants.connectionsArrayName, global);
    }
    getArrayFromSettings(configSection, global = true) {
        let configuration = this._vscodeWrapper.getConfiguration(Constants.extensionName, this._vscodeWrapper.activeTextEditorUri);
        let configValue = configuration.inspect(configSection);
        if (global) {
            // only return the global values if that's what's requested
            return configValue.globalValue || [];
        }
        else {
            // otherwise, return the combination of the workspace and workspace folder values
            return (configValue.workspaceValue || []).concat(configValue.workspaceFolderValue || []);
        }
    }
    /**
     * Replace existing profiles in the user settings with a new set of profiles.
     * @param profiles the set of profiles to insert into the settings file.
     */
    writeProfilesToSettings(profiles) {
        return __awaiter(this, void 0, void 0, function* () {
            // Clear any sensitive information from the profiles before saving
            const cleanProfiles = profiles.map((profile) => {
                let savedProfile;
                savedProfile = Object.assign({}, profile, {
                    azureAccountToken: "",
                    expiresOn: 0,
                    password: "",
                });
                if (!profile.password &&
                    !profile.savePassword &&
                    profile.authenticationType === connectionDialog_1.AuthenticationType.SqlLogin) {
                    // Save the profile as requiring no password
                    savedProfile.emptyPasswordInput = true;
                }
                return savedProfile;
            });
            // Save the file
            yield this._vscodeWrapper.setConfiguration(Constants.extensionName, Constants.connectionsArrayName, cleanProfiles);
        });
    }
    /** Compare function for sorting by profile name if available, otherwise fall back to server name or connection string */
    compareConnectionProfile(connA, connB) {
        const nameA = connA.profileName
            ? connA.profileName
            : connA.server
                ? connA.server
                : connA.connectionString;
        const nameB = connB.profileName
            ? connB.profileName
            : connB.server
                ? connB.server
                : connB.connectionString;
        return nameA.localeCompare(nameB);
    }
}
exports.ConnectionConfig = ConnectionConfig;

//# sourceMappingURL=connectionconfig.js.map
