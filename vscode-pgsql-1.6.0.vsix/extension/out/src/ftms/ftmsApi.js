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
exports.FtmsApi = void 0;
const models_1 = require("./models");
const node_fetch_1 = require("node-fetch");
const https = require("https");
const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
});
var FtmsApi;
(function (FtmsApi) {
    // TODO: Change this base URL to point to the actual service
    const FTMS_API_URL = "https://127.0.0.1:5114/";
    function CreateInstance(session, info) {
        return __awaiter(this, void 0, void 0, function* () {
            const jsonObj = new models_1.ApiModels.CreateInstanceRequest(info);
            return (0, node_fetch_1.default)(FTMS_API_URL + "CreateInstance", {
                method: models_1.HttpMethods.POST,
                body: JSON.stringify(jsonObj),
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.accessToken}`,
                },
                agent: httpsAgent,
            }).then((resp) => {
                return resp.json();
            });
        });
    }
    FtmsApi.CreateInstance = CreateInstance;
    function CheckInstance(session) {
        return __awaiter(this, void 0, void 0, function* () {
            return (0, node_fetch_1.default)(FTMS_API_URL + "CheckInstance", {
                method: models_1.HttpMethods.GET,
                headers: {
                    Authorization: `Bearer ${session.accessToken}`,
                },
                agent: httpsAgent,
            }).then((resp) => __awaiter(this, void 0, void 0, function* () {
                return resp.status === 200;
            }));
        });
    }
    FtmsApi.CheckInstance = CheckInstance;
})(FtmsApi || (exports.FtmsApi = FtmsApi = {}));

//# sourceMappingURL=ftmsApi.js.map
