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
exports.CredentialStore = void 0;
const serviceclient_1 = require("../languageservice/serviceclient");
const Contracts = require("../models/contracts");
const connectionStore_1 = require("../models/connectionStore");
/**
 * Implements a credential storage for Windows, Mac (darwin), or Linux.
 * Allows a single credential to be stored per service (that is, one username per service);
 */
class CredentialStore {
    constructor(_context, _client) {
        this._context = _context;
        this._client = _client;
        if (!this._client) {
            this._client = serviceclient_1.default.instance;
        }
        this._secretStorage = this._context.secrets;
    }
    /**
     * Gets a credential saved in the credential store
     * @param credentialId the ID uniquely identifying this credential
     * @returns Promise that resolved to the credential, or undefined if not found
     */
    readCredential(credentialId) {
        return __awaiter(this, void 0, void 0, function* () {
            let cred = new Contracts.Credential();
            cred.credentialId = credentialId;
            const password = yield this._secretStorage.get(credentialId);
            cred.password = password;
            if (!password) {
                // Some older extension versions may have stored the credential with
                // a key that did not use the `port` property since a password was
                // not. Try removing the port and looking again. Future credential saves
                // will use the port, and this code will become obsolete.
                const credentialIdParts = credentialId.split(connectionStore_1.ConnectionStore.CRED_SEPARATOR);
                const partsWithoutPort = credentialIdParts.filter((part) => !part.startsWith(connectionStore_1.ConnectionStore.CRED_PORT_PREFIX));
                const credentialIdWithoutPort = partsWithoutPort.join(connectionStore_1.ConnectionStore.CRED_SEPARATOR);
                const passwordWithoutPort = yield this._secretStorage.get(credentialIdWithoutPort);
                cred.password = passwordWithoutPort;
            }
            return cred;
        });
    }
    saveCredential(credentialId, password) {
        return __awaiter(this, void 0, void 0, function* () {
            let cred = new Contracts.Credential();
            cred.credentialId = credentialId;
            cred.password = password;
            yield this._secretStorage.store(credentialId, password);
            return true;
        });
    }
    deleteCredential(credentialId) {
        return __awaiter(this, void 0, void 0, function* () {
            let cred = new Contracts.Credential();
            cred.credentialId = credentialId;
            yield this._secretStorage.delete(credentialId);
            return true;
        });
    }
}
exports.CredentialStore = CredentialStore;

//# sourceMappingURL=credentialstore.js.map
