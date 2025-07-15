"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiModels = exports.HttpMethods = void 0;
var HttpMethods;
(function (HttpMethods) {
    HttpMethods["GET"] = "GET";
    HttpMethods["POST"] = "POST";
    HttpMethods["QUERY"] = "QUERY";
})(HttpMethods || (exports.HttpMethods = HttpMethods = {}));
var ApiModels;
(function (ApiModels) {
    class CreateInstanceRequest {
        constructor(info) {
            this.profileName = "";
            this.username = "";
            this.password = "";
            this.dbName = "";
            this.profileName = info.profileName;
            this.username = info.username;
            this.password = info.password;
            this.dbName = info.dbName;
        }
    }
    ApiModels.CreateInstanceRequest = CreateInstanceRequest;
})(ApiModels || (exports.ApiModels = ApiModels = {}));

//# sourceMappingURL=models.js.map
