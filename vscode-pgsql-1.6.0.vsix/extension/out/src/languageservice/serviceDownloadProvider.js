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
const path = require("path");
const tmp = require("tmp");
const platform_1 = require("../models/platform");
const interfaces_1 = require("./interfaces");
const Constants = require("../constants/constants");
const fs = require("fs/promises");
const crypto = require("crypto");
/*
 * Service Download Provider class which handles downloading the SQL Tools service.
 */
class ServiceDownloadProvider {
    constructor(_config, _logger, _statusView, _httpClient, _decompressProvider) {
        var _a;
        this._config = _config;
        this._logger = _logger;
        this._statusView = _statusView;
        this._httpClient = _httpClient;
        this._decompressProvider = _decompressProvider;
        (_a = this._logger) === null || _a === void 0 ? void 0 : _a.appendLine("ServiceDownloadProvider initialized");
        // Ensure our temp files get cleaned up in case of error.
        tmp.setGracefulCleanup();
    }
    /**
     * Returns the download url for given platform
     */
    getDownloadFileName(platform) {
        var _a, _b;
        let fileNamesJson = this._config.getSqlToolsConfigValue("downloadFileNames");
        let fileName = fileNamesJson[platform.toString()];
        if (fileName === undefined) {
            if (process.platform === "linux") {
                (_a = this._logger) === null || _a === void 0 ? void 0 : _a.appendLine(`No download file name found for linux, platform ${platform.toString()} `);
                throw new Error("Unsupported linux distribution");
            }
            else {
                (_b = this._logger) === null || _b === void 0 ? void 0 : _b.appendLine(`No download file name found for platform ${platform.toString()} `);
                throw new Error(`Unsupported platform: ${process.platform}`);
            }
        }
        return fileName;
    }
    /**
     * Returns SQL tools service installed folder, creating it if it doesn't exist.
     */
    getOrMakeInstallDirectory(platform) {
        return __awaiter(this, void 0, void 0, function* () {
            let basePath = this.getInstallDirectoryRoot();
            let versionFromConfig = this._config.getSqlToolsPackageVersion();
            basePath = basePath.replace("{#version#}", versionFromConfig);
            basePath = basePath.replace("{#platform#}", (0, platform_1.getRuntimeDisplayName)(platform));
            try {
                yield fs.mkdir(basePath, { recursive: true });
            }
            catch (_a) {
                // Best effort to make the folder, if it already exists (expected scenario) or something else happens
                // then just carry on
            }
            return basePath;
        });
    }
    /**
     * Returns SQL tools service installed folder root.
     */
    getInstallDirectoryRoot() {
        let installDirFromConfig = this._config.getSqlToolsInstallDirectory();
        let basePath;
        if (path.isAbsolute(installDirFromConfig)) {
            basePath = installDirFromConfig;
        }
        else {
            // The path from config is relative to the out folder
            basePath = path.join(__dirname, "../../" + installDirFromConfig);
        }
        return basePath;
    }
    getDownloadUrl(fileName) {
        let baseDownloadUrl = this._config.getSqlToolsServiceDownloadUrl();
        let version = this._config.getSqlToolsPackageVersion();
        baseDownloadUrl = baseDownloadUrl.replace("{#version#}", version);
        baseDownloadUrl = baseDownloadUrl.replace("{#fileName#}", fileName);
        return baseDownloadUrl;
    }
    /**
     * Downloads the SQL tools service and decompress it in the install folder.
     */
    installSQLToolsService(platform) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f;
            const fileName = this.getDownloadFileName(platform);
            const hashAlg = this._config.getHashAlgorithm();
            const hashDigest = this._config.getPackageHash(fileName);
            (_a = this._logger) === null || _a === void 0 ? void 0 : _a.appendLine(`Using tools server filename: ${fileName}`);
            const installDirectory = yield this.getOrMakeInstallDirectory(platform);
            (_b = this._logger) === null || _b === void 0 ? void 0 : _b.appendLine(`${Constants.serviceInstallingTo} ${installDirectory}.`);
            const urlString = this.getDownloadUrl(fileName);
            const isZipFile = path.extname(fileName) === ".zip";
            (_c = this._logger) === null || _c === void 0 ? void 0 : _c.appendLine(`${Constants.serviceDownloading} ${urlString}`);
            let pkg = {
                installPath: installDirectory,
                url: urlString,
                tmpFile: undefined,
                isZipFile: isZipFile,
                hash: {
                    algorithm: hashAlg,
                    digest: hashDigest,
                },
            };
            const tmpResult = yield this.createTempFile(pkg);
            pkg.tmpFile = tmpResult;
            try {
                yield this._httpClient.downloadFile(pkg.url, pkg, this._logger, this._statusView);
                (_d = this._logger) === null || _d === void 0 ? void 0 : _d.logDebug(`Downloaded to ${pkg.tmpFile.name}...`);
                (_e = this._logger) === null || _e === void 0 ? void 0 : _e.appendLine(" Done!");
                yield this.verify(pkg);
                yield this.install(pkg);
            }
            catch (err) {
                (_f = this._logger) === null || _f === void 0 ? void 0 : _f.appendLine(`[ERROR] ${err}`);
                throw err;
            }
            return true;
        });
    }
    createTempFile(pkg) {
        return new Promise((resolve, reject) => {
            tmp.file({ prefix: "package-" }, (err, filePath, fd, cleanupCallback) => {
                if (err) {
                    return reject(new interfaces_1.PackageError("Error from tmp.file", pkg, err));
                }
                resolve({
                    name: filePath,
                    fd: fd,
                    removeCallback: cleanupCallback,
                });
            });
        });
    }
    verify(pkg) {
        this._logger.appendLine("Verifying ...");
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            try {
                const stats = yield fs.stat(pkg.tmpFile.name);
                (_a = this._logger) === null || _a === void 0 ? void 0 : _a.appendLine(`[DEBUG] Tar file size: ${stats.size} bytes`);
                const hash = crypto.createHash(pkg.hash.algorithm);
                hash.update(yield fs.readFile(pkg.tmpFile.name));
                const checksum = hash.digest("hex");
                (_b = this._logger) === null || _b === void 0 ? void 0 : _b.appendLine(`Manifest has ${pkg.hash.algorithm} hash: ${pkg.hash.digest}`);
                (_c = this._logger) === null || _c === void 0 ? void 0 : _c.appendLine(`Package has  ${pkg.hash.algorithm} hash: ${checksum}`);
                if (checksum !== pkg.hash.digest) {
                    reject(Constants.pgtsHashCheckFailed);
                }
                resolve();
            }
            catch (err) {
                (_d = this._logger) === null || _d === void 0 ? void 0 : _d.appendLine(`[ERROR] Could not stat or checksum tar file: ${err}`);
                reject(err);
            }
        }));
    }
    install(pkg) {
        this._logger.appendLine("Installing ...");
        this._statusView.installingService();
        return new Promise((resolve, reject) => {
            this._decompressProvider
                .decompress(pkg, this._logger)
                .then((_) => {
                this._statusView.serviceInstalled();
                resolve();
            })
                .catch((err) => {
                reject(err);
            });
        });
    }
}
exports.default = ServiceDownloadProvider;

//# sourceMappingURL=serviceDownloadProvider.js.map
