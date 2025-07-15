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
exports.SchemaCompareWebViewController = void 0;
const vscode = require("vscode");
const objectExplorerUtils_1 = require("../objectExplorer/objectExplorerUtils");
const reactWebviewPanelController_1 = require("../controllers/reactWebviewPanelController");
const treeNodeInfo_1 = require("../objectExplorer/treeNodeInfo");
const schemaCompareUtils_1 = require("./schemaCompareUtils");
class SchemaCompareWebViewController extends reactWebviewPanelController_1.ReactWebviewPanelController {
    constructor(context, vscodeWrapper, node, schemaCompareService, connectionMgr, schemaCompareOptionsResult, title) {
        super(context, vscodeWrapper, "schemaCompare", "schemaCompare", {
            defaultDeploymentOptionsResult: schemaCompareOptionsResult,
            sourceEndpointInfo: undefined,
            targetEndpointInfo: undefined,
            schemaCompareResult: undefined,
            generateScriptResultStatus: undefined,
            publishDatabaseChangesResultStatus: undefined,
            schemaComparePublishProjectResult: undefined,
            schemaCompareIncludeExcludeResult: undefined,
            schemaCompareOpenScmpResult: undefined,
            saveScmpResultStatus: undefined,
            cancelResultStatus: undefined,
        }, {
            title: title,
            viewColumn: vscode.ViewColumn.Active,
            iconPath: {
                dark: vscode.Uri.joinPath(context.extensionUri, "media", "schemaCompare_dark.svg"),
                light: vscode.Uri.joinPath(context.extensionUri, "media", "schemaCompare_light.svg"),
            },
        });
        this.schemaCompareService = schemaCompareService;
        this.connectionMgr = connectionMgr;
        this.operationId = (0, schemaCompareUtils_1.generateOperationId)();
        if (node && !this.isTreeNodeInfoType(node)) {
            node = this.getFullSqlProjectsPathFromNode(node);
        }
        void this.start(node);
        this.registerRpcHandlers();
    }
    /**
     * Starts the schema comparison process. Schema compare can get started with four contexts for the source:
     * 1. undefined
     * 2. Connection profile
     * 3. Dacpac
     * 4. Project
     * @param sourceContext can be undefined, connection profile, dacpac, or project.
     * @param comparisonResult Result of a previous comparison, if available.
     */
    start(sourceContext_1) {
        return __awaiter(this, arguments, void 0, function* (sourceContext, comparisonResult = undefined) {
            let source;
            let connectionProfile = sourceContext
                ? sourceContext.connectionInfo
                : undefined;
            if (connectionProfile) {
                source = yield this.getEndpointInfoFromConnectionProfile(connectionProfile, sourceContext);
            }
            else if (sourceContext &&
                sourceContext &&
                sourceContext.endsWith(".dacpac")) {
                source = this.getEndpointInfoFromDacpac(sourceContext);
            }
            else if (sourceContext) {
                source = this.getEndpointInfoFromProject(sourceContext);
            }
            yield this.launch(source, undefined, false, comparisonResult);
        });
    }
    /**
     * Primary functional entrypoint for opening the schema comparison window, and optionally running it.
     * @param source
     * @param target
     * @param runComparison whether to immediately run the schema comparison.  Requires both source and target to be specified.  Cannot be true when comparisonResult is set.
     * @param comparisonResult a pre-computed schema comparison result to display.  Cannot be set when runComparison is true.
     */
    launch(source_1, target_1) {
        return __awaiter(this, arguments, void 0, function* (source, target, runComparison = false, comparisonResult) {
            if (runComparison && comparisonResult) {
                throw new Error("Cannot both pass a comparison result and request a new comparison be run.");
            }
            this.state.sourceEndpointInfo = source;
            this.state.targetEndpointInfo = target;
            this.updateState();
        });
    }
    getEndpointInfoFromConnectionProfile(connectionProfile, sourceContext) {
        return __awaiter(this, void 0, void 0, function* () {
            let ownerUri = yield this.connectionMgr.getUriForConnection(connectionProfile);
            let user = connectionProfile.user;
            if (!user) {
                user = "default";
            }
            const source = {
                endpointType: 0 /* mssql.SchemaCompareEndpointType.Database */,
                serverDisplayName: `${connectionProfile.server} (${user})`,
                serverName: connectionProfile.server,
                databaseName: objectExplorerUtils_1.ObjectExplorerUtils.getDatabaseName(sourceContext),
                ownerUri: ownerUri,
                packageFilePath: "",
                connectionDetails: undefined,
                connectionName: connectionProfile.profileName ? connectionProfile.profileName : "",
                projectFilePath: "",
                targetScripts: [],
                dataSchemaProvider: "",
                extractTarget: 5 /* mssql.ExtractTarget.schemaObjectType */,
            };
            return source;
        });
    }
    getEndpointInfoFromDacpac(sourceDacpac) {
        const source = {
            endpointType: 1 /* mssql.SchemaCompareEndpointType.Dacpac */,
            serverDisplayName: "",
            serverName: "",
            databaseName: "",
            ownerUri: "",
            packageFilePath: sourceDacpac,
            connectionDetails: undefined,
            projectFilePath: "",
            targetScripts: [],
            dataSchemaProvider: "",
            extractTarget: 5 /* mssql.ExtractTarget.schemaObjectType */,
        };
        return source;
    }
    getEndpointInfoFromProject(sourceProject) {
        const source = {
            endpointType: 2 /* mssql.SchemaCompareEndpointType.Project */,
            packageFilePath: "",
            serverDisplayName: "",
            serverName: "",
            databaseName: "",
            ownerUri: "",
            connectionDetails: undefined,
            projectFilePath: sourceProject,
            targetScripts: [],
            dataSchemaProvider: undefined,
            extractTarget: 5 /* mssql.ExtractTarget.schemaObjectType */,
        };
        return source;
    }
    isTreeNodeInfoType(node) {
        if (node instanceof treeNodeInfo_1.TreeNodeInfo) {
            return true;
        }
        return false;
    }
    getFullSqlProjectsPathFromNode(node) {
        var _a, _b, _c, _d;
        return (_d = (_c = (_b = (_a = node.treeDataProvider) === null || _a === void 0 ? void 0 : _a.roots[0]) === null || _b === void 0 ? void 0 : _b.projectFileUri) === null || _c === void 0 ? void 0 : _c.fsPath) !== null && _d !== void 0 ? _d : "";
    }
    registerRpcHandlers() {
        this.registerReducer("compare", (state, payload) => __awaiter(this, void 0, void 0, function* () {
            const result = yield (0, schemaCompareUtils_1.compare)(this.operationId, payload, this.schemaCompareService);
            state.schemaCompareResult = result;
            return state;
        }));
        this.registerReducer("generateScript", (state, payload) => __awaiter(this, void 0, void 0, function* () {
            const result = yield (0, schemaCompareUtils_1.generateScript)(this.operationId, payload, this.schemaCompareService);
            state.generateScriptResultStatus = result;
            return state;
        }));
        this.registerReducer("publishDatabaseChanges", (state, payload) => __awaiter(this, void 0, void 0, function* () {
            const result = yield (0, schemaCompareUtils_1.publishDatabaseChanges)(this.operationId, payload, this.schemaCompareService);
            state.publishDatabaseChangesResultStatus = result;
            return state;
        }));
        this.registerReducer("publishProjectChanges", (state, payload) => __awaiter(this, void 0, void 0, function* () {
            const result = yield (0, schemaCompareUtils_1.publishProjectChanges)(this.operationId, payload, this.schemaCompareService);
            state.schemaComparePublishProjectResult = result;
            return state;
        }));
        this.registerReducer("getDefaultOptions", (state) => __awaiter(this, void 0, void 0, function* () {
            const result = yield (0, schemaCompareUtils_1.getDefaultOptions)(this.schemaCompareService);
            state.defaultDeploymentOptionsResult = result;
            return state;
        }));
        this.registerReducer("includeExcludeNode", (state, payload) => __awaiter(this, void 0, void 0, function* () {
            const result = yield (0, schemaCompareUtils_1.includeExcludeNode)(this.operationId, payload, this.schemaCompareService);
            state.schemaCompareIncludeExcludeResult = result;
            return state;
        }));
        this.registerReducer("openScmp", (state, payload) => __awaiter(this, void 0, void 0, function* () {
            const result = yield (0, schemaCompareUtils_1.openScmp)(payload, this.schemaCompareService);
            state.schemaCompareOpenScmpResult = result;
            return state;
        }));
        this.registerReducer("saveScmp", (state, payload) => __awaiter(this, void 0, void 0, function* () {
            const result = yield (0, schemaCompareUtils_1.saveScmp)(payload, this.schemaCompareService);
            state.saveScmpResultStatus = result;
            return state;
        }));
        this.registerReducer("cancel", (state) => __awaiter(this, void 0, void 0, function* () {
            const result = yield (0, schemaCompareUtils_1.cancel)(this.operationId, this.schemaCompareService);
            state.cancelResultStatus = result;
            return state;
        }));
    }
}
exports.SchemaCompareWebViewController = SchemaCompareWebViewController;

//# sourceMappingURL=schemaCompareWebViewController.js.map
