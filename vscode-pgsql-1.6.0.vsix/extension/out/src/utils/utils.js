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
exports.CancelError = void 0;
exports.exists = exists;
exports.getUniqueFilePath = getUniqueFilePath;
exports.getNonce = getNonce;
exports.isIConnectionInfo = isIConnectionInfo;
exports.getErrorMessage = getErrorMessage;
exports.listAllIterator = listAllIterator;
exports.getFreePort = getFreePort;
exports.checkPortFree = checkPortFree;
exports.showToolServiceLogs = showToolServiceLogs;
exports.hslToRgb = hslToRgb;
exports.getTextColorForBackgroundHSL = getTextColorForBackgroundHSL;
exports.encodeRFC3986 = encodeRFC3986;
const fs_1 = require("fs");
const vscode = require("vscode");
const node_net = require("net");
const serviceclient_1 = require("../languageservice/serviceclient");
function exists(path, uri) {
    return __awaiter(this, void 0, void 0, function* () {
        if (uri) {
            const fullPath = vscode.Uri.joinPath(uri, path);
            try {
                yield vscode.workspace.fs.stat(fullPath);
                return true;
            }
            catch (_a) {
                return false;
            }
        }
        else {
            try {
                yield fs_1.promises.access(path);
                return true;
            }
            catch (e) {
                return false;
            }
        }
    });
}
/**
 * Generates a unique URI for a file in the specified folder using the
 * provided basename and file extension
 */
function getUniqueFilePath(folder, basename, fileExtension) {
    return __awaiter(this, void 0, void 0, function* () {
        let uniqueFileName;
        let counter = 1;
        if (yield exists(`${basename}.${fileExtension}`, folder)) {
            while (yield exists(`${basename}${counter}.${fileExtension}`, folder)) {
                counter += 1;
            }
            uniqueFileName = vscode.Uri.joinPath(folder, `${basename}${counter}.${fileExtension}`);
        }
        else {
            uniqueFileName = vscode.Uri.joinPath(folder, `${basename}.${fileExtension}`);
        }
        return uniqueFileName;
    });
}
/**
 * Generates a random nonce value that can be used in a webview
 */
function getNonce() {
    let text = "";
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
class CancelError extends Error {
}
exports.CancelError = CancelError;
function isIConnectionInfo(connectionInfo) {
    return ((connectionInfo && connectionInfo.server && connectionInfo.authenticationType) ||
        connectionInfo.connectionString);
}
/**
 * Consolidates on the error message string
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getErrorMessage(error) {
    return error instanceof Error
        ? typeof error.message === "string"
            ? error.message
            : ""
        : typeof error === "string"
            ? error
            : `${JSON.stringify(error, undefined, "\t")}`;
}
// Copied from https://github.com/microsoft/vscode-azuretools/blob/5794d9d2ccbbafdb09d44b2e1883e515077e4a72/azure/src/utils/uiUtils.ts#L26
function listAllIterator(iterator) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, iterator_1, iterator_1_1;
        var _b, e_1, _c, _d;
        const resources = [];
        try {
            for (_a = true, iterator_1 = __asyncValues(iterator); iterator_1_1 = yield iterator_1.next(), _b = iterator_1_1.done, !_b; _a = true) {
                _d = iterator_1_1.value;
                _a = false;
                const r = _d;
                resources.push(r);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (!_a && !_b && (_c = iterator_1.return)) yield _c.call(iterator_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return resources;
    });
}
function getFreePort(portMin, portMax, maxTries) {
    return __awaiter(this, void 0, void 0, function* () {
        const portList = Array.from({ length: maxTries }, () => {
            return Math.floor(Math.random() * (portMax - portMin) + portMin);
        });
        for (const port of portList) {
            if (yield checkPortFree(port)) {
                return [portList, port];
            }
        }
        return [portList, undefined];
    });
}
function checkPortFree(port) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((res, _) => {
            const test_server = node_net.createServer();
            test_server
                .once("error", (_err) => {
                res(false);
            })
                .once("listening", () => {
                test_server.once("close", () => {
                    res(true);
                });
                test_server.close();
            })
                .listen(port);
        });
    });
}
function showToolServiceLogs(vscodeWrapper) {
    return __awaiter(this, void 0, void 0, function* () {
        const logPath = serviceclient_1.default.instance.pgsqlToolsLogPath;
        try {
            const doc = yield vscode.workspace.openTextDocument(serviceclient_1.default.instance.pgsqlToolsLogPath);
            yield vscode.window.showTextDocument(doc);
        }
        catch (e) {
            const errorMsg = getErrorMessage(e);
            const msg = `Unable to open Tools Service logs at: \n${logPath}\n You may need to open the file manually.`;
            vscodeWrapper.showErrorMessage(msg);
            vscodeWrapper.logToOutputChannel(errorMsg);
            vscodeWrapper.logToOutputChannel(msg);
        }
    });
}
/**
 * Utility to convert HSL to RGB color representation
 *
 * @param h Hue, 0 <= H < 360
 * @param s Saturation, 0 <= S <= 1
 * @param l Luminance, 0 <= L <= 1
 * @returns RGB tuple, 0 <= x <= 255
 */
function hslToRgb(h, s, l) {
    // Force inputs within bounds
    const _h = Math.floor(h) % 360;
    const _s = Math.max(Math.min(s, 1), 0);
    const _l = Math.max(Math.min(l, 1), 0);
    // Intermediate calculations
    const C = (1 - Math.abs(2 * _l - 1)) * _s;
    const X = C * (1 - Math.abs(((_h / 60) % 2) - 1));
    const m = _l - C / 2;
    let _rgb = [0, 0, 0];
    switch (Math.floor(_h / 60)) {
        case 1:
            _rgb = [C, X, 0];
            break;
        case 2:
            _rgb = [X, C, 0];
            break;
        case 3:
            _rgb = [0, C, X];
            break;
        case 4:
            _rgb = [0, X, C];
            break;
        case 5:
            _rgb = [X, 0, C];
            break;
        case 6:
            _rgb = [C, 0, X];
            break;
    }
    return [(_rgb[0] + m) * 255, (_rgb[1] + m) * 255, (_rgb[2] + m) * 255];
}
/**
 * Utility to get the appropriate text color for a background HSL color
 *
 * @param h Hue, 0 <= H < 360
 * @param s Saturation, 0 <= S <= 1
 * @param l Luminance, 0 <= L <= 1
 * @returns "#000" | "#fff"
 */
function getTextColorForBackgroundHSL(h, s, l) {
    const [r, g, b] = hslToRgb(h, s, l);
    const srgb = [r / 255, g / 255, b / 255];
    const x = srgb.map((i) => {
        if (i <= 0.04045) {
            return i / 12.92;
        }
        else {
            return Math.pow((i + 0.055) / 1.055, 2.4);
        }
    });
    const L = 0.2126 * x[0] + 0.7152 * x[1] + 0.0722 * x[2];
    return L > 0.179 ? "#000" : "#fff";
}
/**
 * Utility to encode URL strings per RFC3986. Code from:
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent#encoding_for_rfc3986
 *
 * @param str The string to escape & encode appropriately
 * @returns The encoded string
 */
function encodeRFC3986(str) {
    return encodeURIComponent(str).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
}

//# sourceMappingURL=utils.js.map
