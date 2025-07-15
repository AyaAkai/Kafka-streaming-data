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
exports.PgsqlProtocolHandler = void 0;
const connection_1 = require("./models/contracts/connection");
const logger_1 = require("./models/logger");
const Loc = require("./constants/locConstants");
var Command;
(function (Command) {
    Command["connect"] = "/connect";
})(Command || (Command = {}));
/**
 * Handles PGSQL protocol URIs.
 */
class PgsqlProtocolHandler {
    constructor(client, vscodeWrapper) {
        this.client = client;
        this.vscodeWrapper = vscodeWrapper;
        const channel = this.vscodeWrapper.outputChannel;
        this._logger = logger_1.Logger.create(channel, "PgsqlProtocolHandler");
    }
    /**
     * Handles the given URI and returns connection information if applicable. Examples of URIs handled:
     * - vscode://ms-ossdata.vscode-pgsql/connect?server={myServer}&database={dbName}&user={user}&authenticationType=SqlLogin
     *
     * @param uri - The URI to handle.
     * @returns The connection information or undefined if not applicable.
     */
    handleUri(uri) {
        if (uri.toString().includes("password")) {
            throw new Error(Loc.ProtocolHandler.passwordInUri);
        }
        this._logger.logDebug(`URI: ${uri.toString()}`);
        switch (uri.path) {
            case Command.connect:
                return this.connect(uri);
            default:
                this._logger.logDebug(`Unknown URI path: ${uri.path}`);
                const supportedPaths = Object.values(Command).join(", ");
                throw new Error(Loc.ProtocolHandler.invalidPath(uri.path, supportedPaths));
        }
    }
    /**
     * Connects using the given URI.
     *
     * @param uri - The URI containing connection information.
     * @returns The connection information or undefined if not applicable.
     */
    connect(uri) {
        return this.readProfileFromArgs(uri.query);
    }
    /**
     * Reads the profile information from the query string and returns an IConnectionInfo object.
     *
     * @param query - The query string containing connection information.
     * @returns The connection information object or undefined if the query is empty.
     */
    readProfileFromArgs(query) {
        return __awaiter(this, void 0, void 0, function* () {
            const capabilitiesResult = yield this.client.sendRequest(connection_1.GetCapabilitiesRequest.type, {});
            const connectionOptions = capabilitiesResult.capabilities.connectionProvider.options;
            const connectionInfo = {};
            const args = new URLSearchParams(query);
            if (args.size === 0) {
                throw new Error(Loc.ProtocolHandler.noConnectionInUri);
            }
            // Only requirement is to have provided a server name
            const serverName = args.get("server");
            if (!serverName) {
                throw new Error(Loc.ProtocolHandler.noServerInUri);
            }
            const profileName = args.get("profileName");
            if (profileName) {
                connectionInfo["profileName"] = profileName;
            }
            // Map the connection options to their respective types
            // special handling for host -> server and dbname -> database
            const connectionOptionProperties = connectionOptions.map((option) => {
                if (option.name === "host") {
                    option.name = "server";
                }
                else if (option.name === "dbname") {
                    option.name = "database";
                }
                return {
                    name: option.name,
                    type: option.valueType,
                };
            });
            for (const property of connectionOptionProperties) {
                const propName = property.name;
                const propValue = args.get(propName);
                if (propValue === undefined || propValue === null) {
                    continue;
                }
                switch (property.type) {
                    case "string":
                    case "category":
                        connectionInfo[propName] = propValue;
                        break;
                    case "number":
                        const numericalValue = parseInt(propValue);
                        if (!isNaN(numericalValue)) {
                            connectionInfo[propName] = numericalValue;
                        }
                        break;
                    case "boolean":
                        connectionInfo[propName] = propValue === "true" || propValue === "1";
                        break;
                    default:
                        break;
                }
            }
            if (connectionInfo["authenticationType"] === undefined) {
                connectionInfo["authenticationType"] = "SqlLogin" /* AuthenticationType.SqlLogin */;
            }
            return connectionInfo;
        });
    }
}
exports.PgsqlProtocolHandler = PgsqlProtocolHandler;

//# sourceMappingURL=pgsqlProtocolHandler.js.map
