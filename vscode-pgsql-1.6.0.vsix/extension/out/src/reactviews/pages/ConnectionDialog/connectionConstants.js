"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.CONNECTION_STRINGS = exports.addFirewallRuleReadMoreUrl = exports.sqlDbPrefix = exports.connectionCertValidationReadMoreUrl = void 0;
exports.connectionCertValidationReadMoreUrl = "https://learn.microsoft.com/sql/database-engine/configure-windows/enable-encrypted-connections-to-the-database-engine";
exports.sqlDbPrefix = ".postgres.database.azure.com";
exports.addFirewallRuleReadMoreUrl = "https://aka.ms/sqlopsfirewallhelp";
exports.CONNECTION_STRINGS = {
    POSTGRESQL: {
        name: "PostgreSQL",
        prefix: "postgres://",
        allprefixes: ["postgres://", "postgresql://"],
        // Handle user with or without password
        pattern: /^postgres(?:ql)?:\/\/(?:([^:@\/]+)(?::([^@\/]*))?@)?([^:\/]+)?(?::(\d+))?(?:\/([^?]+))?/,
    },
    PSQL: {
        name: "psql",
        prefix: "psql",
    },
    ENV_VARS: {
        name: "Environment Variables",
        prefix: "export",
    },
    JDBC: {
        name: "JDBC",
        prefix: "jdbc:postgres",
    },
    NODEJS: {
        name: "Node.js",
        prefix: "new Client",
        pattern: /(\w+):\s*"([^"]+)"|(\w+):\s*\{([^}]+)\}|(\w+):\s*(\d+)/g,
    },
    PHP: {
        name: "PHP",
        prefix: "pg_connect",
        pattern: /(\w+)=([^ )"]+)/g,
    },
    PYTHON: {
        name: "Python",
        prefix: "psycopg2.connect",
        pattern: /user="([^"]+)",\s*password="([^"]+)",\s*host="([^"]+)",\s*port=(\d+),\s*database="([^"]+)"/g,
    },
    RUBY: {
        name: "Ruby",
        prefix: "PG::Connection.new",
        // Matches key => 'value' or key => "value", any order, optional spaces, comma-separated
        pattern: /(user|password|database|host|port)\s*=>\s*(["'])(.*?)\2/g,
    },
    SEMICOLON: {
        name: "Semicolon-separated",
        prefix: "",
        pattern: /(\w+)=([^;]+)/g,
    },
};

//# sourceMappingURL=connectionConstants.js.map
