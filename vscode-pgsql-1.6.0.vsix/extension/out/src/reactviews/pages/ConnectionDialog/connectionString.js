"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectionStringParser = void 0;
const connectionConstants_1 = require("./connectionConstants");
function ok(value) {
    return { ok: true, value };
}
function err(error) {
    return { ok: false, error };
}
class ConnectionStringParser {
    constructor(connectionString) {
        this.connectionString = connectionString;
    }
    getParameters() {
        if (!this.connectionString) {
            return err({ unsupportedFormat: true });
        }
        const parameters = this.parse();
        if (!Object.keys(parameters).length) {
            return err({ unsupportedFormat: true });
        }
        const server = parameters.server || parameters.host;
        const user = parameters.user || parameters.username || parameters["user id"];
        let missingParameters = [];
        if (!server) {
            missingParameters.push(ConnectionStringParser.serverAttribute);
        }
        if (!user) {
            missingParameters.push(ConnectionStringParser.userAttribute);
        }
        if (missingParameters.length) {
            return err({
                unsupportedFormat: false,
                connectionStringType: this.detectedType,
                missingParameters,
            });
        }
        return ok({
            host: server,
            user: user,
            port: parameters.port || "",
            database: parameters.database || parameters.dbname || "",
            password: parameters.password || "",
        });
    }
    parse() {
        if (connectionConstants_1.CONNECTION_STRINGS.POSTGRESQL.allprefixes.some((prefix) => this.connectionString.startsWith(prefix))) {
            return this.parsePostgres(this.connectionString);
        }
        else if (this.connectionString.startsWith(connectionConstants_1.CONNECTION_STRINGS.PSQL.prefix)) {
            return this.parsePsql();
        }
        else if (this.connectionString.startsWith(connectionConstants_1.CONNECTION_STRINGS.ENV_VARS.prefix)) {
            return this.parseEnvVariables();
        }
        else if (this.connectionString.startsWith(connectionConstants_1.CONNECTION_STRINGS.JDBC.prefix)) {
            return this.parseJdbc();
        }
        else if (this.connectionString.includes(connectionConstants_1.CONNECTION_STRINGS.NODEJS.prefix)) {
            return this.parseNodejs();
        }
        else if (this.connectionString.includes(connectionConstants_1.CONNECTION_STRINGS.PHP.prefix)) {
            return this.parsePHPConnect();
        }
        else if (this.connectionString.includes(connectionConstants_1.CONNECTION_STRINGS.PYTHON.prefix)) {
            return this.parsePythonPsycopg();
        }
        else if (this.connectionString.includes(connectionConstants_1.CONNECTION_STRINGS.RUBY.prefix)) {
            return this.parseRuby();
        }
        else if (this.connectionString.includes(";")) {
            return this.parseSemiColonSeparated();
        }
        else {
            return {};
        }
    }
    parseSemiColonSeparated() {
        const params = this.connectionString.split(";");
        this.detectedType = connectionConstants_1.CONNECTION_STRINGS.SEMICOLON.name;
        const result = {};
        params.forEach((param) => {
            const [key, value] = param.split("=");
            if (key && value) {
                const parsedKey = key.trim().toLowerCase();
                result[parsedKey] = value.trim();
            }
        });
        return result;
    }
    parsePostgres(connectionString) {
        const parser = connectionConstants_1.CONNECTION_STRINGS.POSTGRESQL.pattern;
        const userIdx = 1;
        const passwordIdx = 2;
        const hostIdx = 3;
        const portIdx = 4;
        const databaseIdx = 5;
        let parsed = parser.exec(connectionString);
        if (!parsed) {
            return {};
        }
        let result = {
            user: parsed[userIdx] || "",
            password: parsed[passwordIdx] || "",
            host: parsed[hostIdx] || "",
            port: parsed[portIdx] || "",
            database: parsed[databaseIdx] || "",
        };
        // Use URLSearchParams one for parsing the query parameters, in case not caught by the regex
        // URLSearchParams does not handle the port field: https://developer.mozilla.org/en-US/docs/Web/API/URL/port
        try {
            const urlObj = new URL(connectionString);
            const params = new URLSearchParams(urlObj.search);
            params.forEach((value, key) => {
                const parameterName = key;
                if (!result[parameterName]) {
                    result[parameterName] = value;
                }
            });
        }
        catch (err) {
            // If the string is not a valid URL at this point assert a failure
            console.error("Failed to parse connection string as URL:", err);
            return {};
        }
        return result;
    }
    // Parse psql command line arguments: psql [option...] [dbname [username]]
    parsePsql() {
        this.detectedType = connectionConstants_1.CONNECTION_STRINGS.PSQL.name;
        const result = {};
        const psqlOptionMap = {
            h: "host",
            p: "port",
            U: "user",
            d: "database",
        };
        const segments = this.connectionString.split(" -").slice(1); // Split by " -" and remove the first "psql" element
        const lastSegment = segments.pop();
        segments.forEach((segment) => {
            if (segment.trim().includes(" ")) {
                const [key, value] = segment.trim().split(/\s+/);
                const psqlKey = psqlOptionMap[key.trim()];
                if (key && value && psqlKey) {
                    result[psqlKey] = value.trim();
                }
            }
        });
        if (lastSegment) {
            const parts = lastSegment.trim().split(/\s+/);
            if (parts.length >= 2) {
                const key = parts[0];
                const value = parts[1];
                const psqlKey = psqlOptionMap[key];
                if (psqlKey) {
                    result[psqlKey] = value;
                }
                if (!result.database && parts.length >= 3) {
                    result.database = parts[2];
                }
                if (!result.user && parts.length >= 4) {
                    result.user = parts[3];
                }
            }
        }
        return result;
    }
    parseEnvVariables() {
        this.detectedType = connectionConstants_1.CONNECTION_STRINGS.ENV_VARS.name;
        const result = {};
        const psqlOptionMap = {
            PGHOST: "host",
            PGUSER: "user",
            PGPORT: "port",
            PGDATABASE: "database",
            PGPASSWORD: "password",
        };
        const segments = this.connectionString.split("export ").slice(1); // Split by " -" and remove the first "psql" element
        segments.forEach((segment) => {
            const [key, value] = segment.trim().split("=");
            const psqlKey = psqlOptionMap[key.trim()];
            if (key && value && psqlKey) {
                result[psqlKey] = value.trim();
            }
        });
        return result;
    }
    parseJdbc() {
        let result = this.parsePostgres(this.connectionString.slice(5));
        return result;
    }
    parseNodejs() {
        this.detectedType = connectionConstants_1.CONNECTION_STRINGS.NODEJS.name;
        const result = {};
        const regex = connectionConstants_1.CONNECTION_STRINGS.NODEJS.pattern;
        let match;
        while ((match = regex.exec(this.connectionString))) {
            const key = match[1] || match[3] || match[5];
            const value = match[2] || match[4] || match[6];
            result[key.trim().toLowerCase()] = value.trim();
        }
        return result;
    }
    parsePHPConnect() {
        this.detectedType = connectionConstants_1.CONNECTION_STRINGS.PHP.name;
        const result = {};
        const regex = connectionConstants_1.CONNECTION_STRINGS.PHP.pattern;
        let match;
        while ((match = regex.exec(this.connectionString))) {
            const key = match[1];
            const value = match[2];
            result[key.trim().toLowerCase()] = value.trim();
        }
        return result;
    }
    parsePythonPsycopg() {
        this.detectedType = connectionConstants_1.CONNECTION_STRINGS.PYTHON.name;
        const result = {};
        const regex = connectionConstants_1.CONNECTION_STRINGS.PYTHON.pattern;
        let match;
        while ((match = regex.exec(this.connectionString))) {
            result.user = match[1];
            result.password = match[2];
            result.host = match[3];
            result.port = match[4];
            result.database = match[5];
        }
        return result;
    }
    parseRuby() {
        this.detectedType = connectionConstants_1.CONNECTION_STRINGS.RUBY.name;
        const result = {};
        const regex = connectionConstants_1.CONNECTION_STRINGS.RUBY.pattern;
        let match;
        // Extract all key-value pairs
        while ((match = regex.exec(this.connectionString))) {
            const key = match[1];
            const value = match[3];
            switch (key) {
                case "user":
                    result.user = value;
                    break;
                case "password":
                    result.password = value;
                    break;
                case "database":
                    result.database = value;
                    break;
                case "host":
                    result.host = value;
                    break;
                case "port":
                    result.port = value;
                    break;
            }
        }
        return result;
    }
}
exports.ConnectionStringParser = ConnectionStringParser;
ConnectionStringParser.serverAttribute = "server";
ConnectionStringParser.userAttribute = "user";

//# sourceMappingURL=connectionString.js.map
