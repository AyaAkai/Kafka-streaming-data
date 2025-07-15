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
const DecompressTar = require("tar");
const yauzl = require("yauzl");
const fs = require("fs");
const path = require("path");
class DecompressProvider {
    decompressZip(pkg, logger) {
        return new Promise((resolve, reject) => {
            let totalFiles = 0;
            yauzl.open(pkg.tmpFile.name, { lazyEntries: true }, (err, zipfile) => {
                if (err || !zipfile) {
                    logger.appendLine(`[ERROR] ${err}`);
                    return reject(err);
                }
                // Kick off the unzip loop per file entry
                zipfile.readEntry();
                zipfile.on("entry", (entry) => {
                    totalFiles++;
                    const entryPath = path.join(pkg.installPath, entry.fileName);
                    if (/\/$/.test(entry.fileName)) {
                        this.createDirectory(entryPath, logger)
                            .then(() => zipfile.readEntry())
                            .catch(reject);
                    }
                    else {
                        this.extractFile(zipfile, entry, entryPath, logger)
                            .then(() => zipfile.readEntry())
                            .catch(reject);
                    }
                });
                zipfile.on("end", () => {
                    logger.appendLine(`Done! ${totalFiles} files unpacked.\n`);
                    resolve();
                });
                zipfile.on("error", (err) => {
                    logger.appendLine(`[ERROR] ${err}`);
                    reject(err);
                });
            });
        });
    }
    createDirectory(dirPath, logger) {
        return new Promise((resolve, reject) => {
            fs.mkdir(dirPath, { recursive: true }, (err) => {
                if (err) {
                    logger.appendLine(`[ERROR] ${err}`);
                    return reject(err);
                }
                resolve();
            });
        });
    }
    extractFile(zipfile, entry, entryPath, logger) {
        return new Promise((resolve, reject) => {
            fs.mkdir(path.dirname(entryPath), { recursive: true }, (err) => {
                if (err) {
                    logger.appendLine(`[ERROR] ${err}`);
                    return reject(err);
                }
                zipfile.openReadStream(entry, (err, readStream) => {
                    if (err || !readStream) {
                        logger.appendLine(`[ERROR] ${err}`);
                        return reject(err);
                    }
                    const writeStream = fs.createWriteStream(entryPath);
                    readStream.pipe(writeStream);
                    writeStream.on("close", () => resolve());
                    writeStream.on("error", (err) => {
                        logger.appendLine(`[ERROR] ${err}`);
                        reject(err);
                    });
                });
            });
        });
    }
    decompressTar(pkg, logger) {
        return __awaiter(this, void 0, void 0, function* () {
            let totalFiles = 0;
            return DecompressTar.extract({
                file: pkg.tmpFile.name,
                cwd: pkg.installPath,
                onentry: () => {
                    totalFiles++;
                },
                onwarn: (warn) => {
                    logger.appendLine(`[ERROR] ${warn}`);
                },
            })
                .then(() => {
                logger.appendLine(`Done! ${totalFiles} files unpacked.\n`);
            })
                .catch((err) => {
                logger.appendLine(`[ERROR] Extraction failed: ${err}`);
                throw err;
            });
        });
    }
    decompress(pkg, logger) {
        if (pkg.isZipFile) {
            return this.decompressZip(pkg, logger);
        }
        else {
            return this.decompressTar(pkg, logger);
        }
    }
}
exports.default = DecompressProvider;

//# sourceMappingURL=decompressProvider.js.map
