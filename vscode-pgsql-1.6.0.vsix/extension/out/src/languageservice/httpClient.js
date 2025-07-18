"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const http = require("http");
const https = require("https");
const url_1 = require("url");
const interfaces_1 = require("./interfaces");
/*
 * Http client class to handle downloading files using http or https urls
 */
class HttpClient {
    /*
     * Downloads a file and stores the result in the temp file inside the package object
     */
    downloadFile(urlString, pkg, logger, statusView) {
        const url = (0, url_1.parse)(urlString);
        let options = this.getHttpClientOptions(url);
        let clientRequest = url.protocol === "http:" ? http.request : https.request;
        return new Promise((resolve, reject) => {
            if (!pkg.tmpFile || pkg.tmpFile.fd === 0) {
                return reject(new interfaces_1.PackageError("Temporary package file unavailable", pkg));
            }
            let request = clientRequest(options, (response) => {
                if (response.statusCode === 301 || response.statusCode === 302) {
                    // Redirect - download from new location
                    return resolve(this.downloadFile(response.headers.location, pkg, logger, statusView));
                }
                if (response.statusCode !== 200) {
                    // Download failed - print error message
                    logger.appendLine(`failed (error code '${response.statusCode}')`);
                    return reject(new interfaces_1.PackageError(response.statusCode.toString(), pkg));
                }
                // If status code is 200
                this.handleSuccessfulResponse(pkg, response, logger, statusView)
                    .then((_) => {
                    resolve();
                })
                    .catch((err) => {
                    reject(err);
                });
            });
            request.on("error", (error) => {
                reject(new interfaces_1.PackageError(`Request error: ${error.code || "NONE"}`, pkg, error));
            });
            // Execute the request
            request.end();
        });
    }
    getHttpClientOptions(url) {
        let options = {
            host: url.hostname,
            path: url.path,
            agent: undefined,
        };
        if (url.protocol === "https:") {
            let httpsOptions = {
                host: url.hostname,
                path: url.path,
                agent: undefined,
                rejectUnauthorized: true,
            };
            options = httpsOptions;
        }
        return options;
    }
    /*
     * Calculate the download percentage and stores in the progress object
     */
    handleDataReceivedEvent(progress, data, logger, statusView) {
        progress.downloadedBytes += data.length;
        // Update status bar item with percentage
        if (progress.packageSize > 0) {
            let newPercentage = Math.ceil(100 * (progress.downloadedBytes / progress.packageSize));
            if (newPercentage !== progress.downloadPercentage) {
                statusView.updateServiceDownloadingProgress(progress.downloadPercentage);
                progress.downloadPercentage = newPercentage;
            }
            // Update dots after package name in output console
            let newDots = Math.ceil(progress.downloadPercentage / 5);
            if (newDots > progress.dots) {
                logger.append(".".repeat(newDots - progress.dots));
                progress.dots = newDots;
            }
        }
        return;
    }
    handleSuccessfulResponse(pkg, response, logger, statusView) {
        return new Promise((resolve, reject) => {
            const totalSize = parseInt(response.headers["content-length"] || "0", 10);
            const progress = {
                packageSize: totalSize,
                dots: 0,
                downloadedBytes: 0,
                downloadPercentage: 0,
            };
            response.on("data", (data) => {
                this.handleDataReceivedEvent(progress, data, logger, statusView);
            });
            const writeStream = fs.createWriteStream("", { fd: pkg.tmpFile.fd, autoClose: true });
            response.on("error", (err) => {
                reject(new interfaces_1.PackageError(`Response error: ${err.message}`, pkg, err));
            });
            writeStream.on("error", (err) => {
                reject(new interfaces_1.PackageError(`File write error: ${err.message}`, pkg, err));
            });
            writeStream.on("finish", () => {
                resolve();
            });
            response.pipe(writeStream);
        });
    }
}
exports.default = HttpClient;

//# sourceMappingURL=httpClient.js.map
