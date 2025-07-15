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
exports.SchemaDesignerWebviewController = void 0;
const vscode = require("vscode");
const reactWebviewPanelController_1 = require("../controllers/reactWebviewPanelController");
const schemaDesigner_1 = require("../sharedInterfaces/schemaDesigner");
// import { Logger } from "../models/logger";
const utils_1 = require("../utils/utils");
// import { schemaDesignerWebviewOtuputChannelName } from "../constants/constants";
const webview_1 = require("../sharedInterfaces/webview");
const locConstants_1 = require("../constants/locConstants");
// let _channel: vscode.OutputChannel = undefined;
class SchemaDesignerWebviewController extends reactWebviewPanelController_1.ReactWebviewPanelController {
    constructor(context, vscodeWrapper, _schemaDesignerService, _sessionId, title) {
        super(context, vscodeWrapper, "schemaDesigner", "schemaDesigner", {
            schemaState: webview_1.ApiStatus.Loading,
            errorStr: undefined,
            nodes: [],
            edges: [],
            legend: {},
        }, {
            title: `${title}`,
            viewColumn: vscode.ViewColumn.One,
            iconPath: {
                light: vscode.Uri.joinPath(context.extensionUri, "media", "visualizeSchema_light.svg"),
                dark: vscode.Uri.joinPath(context.extensionUri, "media", "visualizeSchema_dark.svg"),
            },
            showRestorePromptAfterClose: false,
        });
        this._schemaDesignerService = _schemaDesignerService;
        this._sessionId = _sessionId;
        this.title = title;
        // private _logger: Logger;
        this._schema = {
            tables: [],
        };
        /*
        _channel = vscodeWrapper.outputChannel;
        this._logger = Logger.create(
            _channel,
            schemaDesignerWebviewOtuputChannelName,
        );
        */
        this.registerRpcHandlers();
        this.updateState();
    }
    handleSessionCreatedNotification(success) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!success) {
                this.state.schemaState = webview_1.ApiStatus.Error;
                this.state.errorStr = locConstants_1.SchemaCompare.connError;
                this.updateState();
                return;
            }
            yield this.triggerRefresh();
        });
    }
    handleGetSchemaModel(schemaReturn) {
        if (schemaReturn instanceof Error) {
            this.state.schemaState = webview_1.ApiStatus.Error;
            this.state.errorStr = schemaReturn.message;
        }
        else {
            this._schema = schemaReturn;
            this.setSchemaToNodes();
            this.state.schemaState = webview_1.ApiStatus.Loaded;
        }
        this.updateState();
    }
    getColorMap() {
        const schemaList = new Set(this._schema.tables.map((table) => {
            return table.tableSchema;
        }));
        const hueInterval = Math.floor(360 / schemaList.size);
        let schemaColors = new Map();
        let currHue = 0;
        const sat = 50;
        const lum = 50;
        for (const schema of schemaList) {
            schemaColors.set(schema, {
                header: `hsl(${currHue}, ${sat}%, ${lum}%)`,
                text: (0, utils_1.getTextColorForBackgroundHSL)(currHue, sat / 100, lum / 100),
            });
            currHue += hueInterval;
        }
        return schemaColors;
    }
    setSchemaToNodes() {
        const schemaColors = this.getColorMap();
        this.state.legend = {};
        schemaColors.forEach((val, key) => {
            this.state.legend[key] = val.header;
        });
        const idNameMap = new Map();
        this.state.nodes = this._schema.tables
            .map((table) => {
            idNameMap.set(table.id, table.name);
            if (table.parentId) {
                return undefined;
            }
            return {
                id: `${table.tableSchema}.${table.name}`,
                position: { x: 0, y: 0 },
                type: schemaDesigner_1.NodeTypes.TableSchema,
                data: {
                    label: `${table.tableSchema}: ${table.name}`,
                    schema: table.columns.map((column) => {
                        return {
                            title: column.name,
                            type: column.dataType,
                            isPrimaryKey: table.primaryKeys.includes(column.name),
                        };
                    }),
                    headerColor: schemaColors.get(table.tableSchema).header,
                    textColor: schemaColors.get(table.tableSchema).text,
                },
            };
        })
            .filter((value) => {
            return value !== undefined;
        });
        const edgeIdSet = new Set();
        this.state.edges = [];
        for (const table of this._schema.tables) {
            this.state.edges.push(...table.relationships
                .map((rel) => {
                const sourceTableName = table.parentId
                    ? idNameMap.get(table.parentId)
                    : table.name;
                const edgeId = `${table.tableSchema}.${sourceTableName}.${rel.column}-${rel.foreignTableSchema}.${rel.foreignTableName}.${rel.foreignColumn}`;
                if (edgeIdSet.has(edgeId)) {
                    return undefined;
                }
                edgeIdSet.add(edgeId);
                return {
                    id: edgeId,
                    source: `${table.tableSchema}.${sourceTableName}`,
                    target: `${rel.foreignTableSchema}.${rel.foreignTableName}`,
                    sourceHandle: rel.column,
                    targetHandle: rel.foreignColumn,
                };
            })
                .filter((value) => {
                return value !== undefined;
            }));
        }
    }
    triggerRefresh() {
        return __awaiter(this, void 0, void 0, function* () {
            this.state.schemaState = webview_1.ApiStatus.Loading;
            this.updateState();
            yield this._schemaDesignerService.getSchemaModel({
                sessionId: this._sessionId,
            });
            return this.state;
        });
    }
    handleConnection(state, _connection) {
        return __awaiter(this, void 0, void 0, function* () {
            return state;
        });
    }
    handleEdgeChanges(state, _changes) {
        return __awaiter(this, void 0, void 0, function* () {
            return state;
        });
    }
    handleNodeChanges(state, _changes) {
        return __awaiter(this, void 0, void 0, function* () {
            return state;
        });
    }
    registerRpcHandlers() {
        this.registerReducer("handleEdgeChanges", (state_1, _a) => __awaiter(this, [state_1, _a], void 0, function* (state, { changes }) {
            return this.handleEdgeChanges(state, changes);
        }));
        this.registerReducer("handleNodeChanges", (state_1, _a) => __awaiter(this, [state_1, _a], void 0, function* (state, { changes }) {
            return this.handleNodeChanges(state, changes);
        }));
        this.registerReducer("handleConnection", (state_1, _a) => __awaiter(this, [state_1, _a], void 0, function* (state, { connection }) {
            return this.handleConnection(state, connection);
        }));
        this.registerReducer("refresh", (_) => __awaiter(this, void 0, void 0, function* () {
            yield this.triggerRefresh();
            return this.state;
        }));
    }
}
exports.SchemaDesignerWebviewController = SchemaDesignerWebviewController;

//# sourceMappingURL=schemaDesignerWebviewController.js.map
