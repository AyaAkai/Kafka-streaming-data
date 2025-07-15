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
exports.generateOperationId = generateOperationId;
exports.compare = compare;
exports.generateScript = generateScript;
exports.publishDatabaseChanges = publishDatabaseChanges;
exports.publishProjectChanges = publishProjectChanges;
exports.getDefaultOptions = getDefaultOptions;
exports.includeExcludeNode = includeExcludeNode;
exports.openScmp = openScmp;
exports.saveScmp = saveScmp;
exports.cancel = cancel;
const utils_1 = require("../models/utils");
/**
 * Generates a unique operation ID.
 *
 * @returns {string} A new GUID representing the operation ID.
 */
function generateOperationId() {
    return (0, utils_1.generateGuid)();
}
/**
 * Compares the schema between the source and target endpoints.
 *
 * @param operationId - The ID of the schema comparison operation.
 * @param payload - The payload containing the comparison parameters.
 * @param schemaCompareService - The service used to perform the schema comparison.
 * @returns A promise that resolves to the result of the schema comparison.
 */
function compare(operationId, payload, schemaCompareService) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield schemaCompareService.compare(operationId, payload.sourceEndpointInfo, payload.targetEndpointInfo, payload.taskExecutionMode, payload.deploymentOptions);
        return result;
    });
}
/**
 * Generates a deploy script for the schema comparison operation.
 *
 * @param operationId - The ID of the schema comparison operation.
 * @param payload - The payload containing parameters for generating the script.
 * @param schemaCompareService - The service used to perform schema comparison operations.
 * @returns A promise that resolves to the result status of the script generation operation.
 */
function generateScript(operationId, payload, schemaCompareService) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield schemaCompareService.generateScript(operationId, payload.targetServerName, payload.targetDatabaseName, payload.taskExecutionMode);
        return result;
    });
}
/**
 * Publishes the database changes script using the provided schema compare service.
 *
 * @param operationId - The ID of the schema comparison operation.
 * @param payload - The payload containing the details required to publish the database changes.
 * @param schemaCompareService - The service used to perform schema compare operations.
 * @returns A promise that resolves to the result status of the publish operation.
 */
function publishDatabaseChanges(operationId, payload, schemaCompareService) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield schemaCompareService.publishDatabaseChanges(operationId, payload.targetServerName, payload.targetDatabaseName, payload.taskExecutionMode);
        return result;
    });
}
/**
 * Publishes the changes script from a schema compare operation to a database project.
 *
 * @param operationId - The ID of the schema comparison operation.
 * @param payload - The payload containing the details required to publish the project changes.
 * @param schemaCompareService - The service used to perform schema compare operations.
 * @returns A promise that resolves to the result of the publish project changes operation.
 */
function publishProjectChanges(operationId, payload, schemaCompareService) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield schemaCompareService.publishProjectChanges(operationId, payload.targetProjectPath, payload.targetFolderStructure, payload.taskExecutionMode);
        return result;
    });
}
/**
 * Retrieves the default schema compare options from the provided schema compare service.
 *
 * @param schemaCompareService - The service used to get the default schema compare options.
 * @returns A promise that resolves to the default schema compare options result.
 */
function getDefaultOptions(schemaCompareService) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield schemaCompareService.getDefaultOptions();
        return result;
    });
}
/**
 * Includes or excludes a node in the schema comparison.
 *
 * @param operationId - The ID of the schema comparison operation.
 * @param payload - The payload containing the details for including or excluding the node.
 * @param schemaCompareService - The service used to perform the include/exclude operation.
 * @returns A promise that resolves to the result of the include/exclude operation.
 */
function includeExcludeNode(operationId, payload, schemaCompareService) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield schemaCompareService.includeExcludeNode(operationId, payload.diffEntry, payload.includeRequest, payload.taskExecutionMode);
        return result;
    });
}
/**
 * Opens a schema compare (.scmp) file and returns the result.
 *
 * @param payload - The payload containing the file path of the .scmp file to open.
 * @param schemaCompareService - The service used to open the .scmp file.
 * @returns A promise that resolves to the result of opening the .scmp file.
 */
function openScmp(payload, schemaCompareService) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield schemaCompareService.openScmp(payload.filePath);
        return result;
    });
}
/**
 * Saves the schema compare (.scmp) file using the provided state and payload.
 *
 * @param payload - The payload containing the necessary information to save the .scmp file.
 * @param schemaCompareService - The service used to perform schema compare operations.
 * @returns A promise that resolves to the result status of the save operation.
 */
function saveScmp(payload, schemaCompareService) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield schemaCompareService.saveScmp(payload.sourceEndpointInfo, payload.targetEndpointInfo, payload.taskExecutionMode, payload.deploymentOptions, payload.scmpFilePath, payload.excludedSourceObjects, payload.excludedTargetObjects);
        return result;
    });
}
/**
 * Cancels an ongoing schema comparison operation.
 *
 * @param operationId - The ID of the schema comparison operation to cancel.
 * @param schemaCompareService - The service used to perform schema comparison operations.
 * @returns A promise that resolves to the result status of the cancel operation.
 */
function cancel(operationId, schemaCompareService) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield schemaCompareService.cancel(operationId);
        return result;
    });
}

//# sourceMappingURL=schemaCompareUtils.js.map
