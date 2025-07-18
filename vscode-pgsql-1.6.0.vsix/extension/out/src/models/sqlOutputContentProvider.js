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
exports.SqlOutputContentProvider = exports.QueryRunnerState = void 0;
const vscode = require("vscode");
const Constants = require("../constants/constants");
const LocalizedConstants = require("../constants/locConstants");
const queryRunner_1 = require("../controllers/queryRunner");
const resultsSerializer_1 = require("../models/resultsSerializer");
const vscodeWrapper_1 = require("./../controllers/vscodeWrapper");
const webviewController_1 = require("../controllers/webviewController");
const telemetry_1 = require("../telemetry/telemetry");
const queryResult_1 = require("../sharedInterfaces/queryResult");
const telemetry_2 = require("../sharedInterfaces/telemetry");
// tslint:disable-next-line:no-require-imports
const pd = require("pretty-data").pd;
const deletionTimeoutTime = 1.8e6; // in ms, currently 30 minutes
const MESSAGE_INTERVAL_IN_MS = 300;
// holds information about the state of a query runner
class QueryRunnerState {
    constructor(queryRunner) {
        this.queryRunner = queryRunner;
        this.flaggedForDeletion = false;
    }
}
exports.QueryRunnerState = QueryRunnerState;
class ResultsConfig {
}
class SqlOutputContentProvider {
    // CONSTRUCTOR /////////////////////////////////////////////////////////
    constructor(context, _statusView, _vscodeWrapper) {
        this.context = context;
        this._statusView = _statusView;
        this._vscodeWrapper = _vscodeWrapper;
        // MEMBER VARIABLES ////////////////////////////////////////////////////
        this._queryResultsMap = new Map();
        this._panels = new Map();
        this._executionPlanOptions = {};
        if (!_vscodeWrapper) {
            this._vscodeWrapper = new vscodeWrapper_1.default();
        }
    }
    setQueryResultWebviewController(queryResultWebviewController) {
        this._queryResultWebviewController = queryResultWebviewController;
    }
    rowRequestHandler(uri, batchId, resultId, rowStart, numberOfRows) {
        return this._queryResultsMap
            .get(uri)
            .queryRunner.getRows(rowStart, numberOfRows, batchId, resultId)
            .then((r) => r.resultSubset);
    }
    configRequestHandler(uri) {
        let queryUri = this._queryResultsMap.get(uri).queryRunner.uri;
        let extConfig = this._vscodeWrapper.getConfiguration(Constants.extensionConfigSectionName, queryUri);
        let config = new ResultsConfig();
        for (let key in Constants.extConfigResultKeys) {
            config[key] = extConfig[key];
        }
        return Promise.resolve(config);
    }
    saveResultsRequestHandler(uri, batchId, resultId, format, selection) {
        let saveResults = new resultsSerializer_1.default();
        saveResults.onSaveResults(uri, batchId, resultId, format, selection);
    }
    openLinkRequestHandler(content, columnName, linkType) {
        this.openLink(content, columnName, linkType);
    }
    copyHeadersRequestHandler(uri, batchId, resultId, selection) {
        void this._queryResultsMap.get(uri).queryRunner.copyHeaders(batchId, resultId, selection);
    }
    copyRequestHandler(uri, batchId, resultId, selection, includeHeaders) {
        void this._queryResultsMap
            .get(uri)
            .queryRunner.copyResults(selection, batchId, resultId, includeHeaders);
    }
    sendToClipboard(uri, data, batchId, resultId, selection, headersFlag) {
        void this._queryResultsMap
            .get(uri)
            .queryRunner.exportCellsToClipboard(data, batchId, resultId, selection, headersFlag);
    }
    editorSelectionRequestHandler(uri, selection) {
        void this._queryResultsMap.get(uri).queryRunner.setEditorSelection(selection);
    }
    showErrorRequestHandler(message) {
        this._vscodeWrapper.showErrorMessage(message);
    }
    showWarningRequestHandler(message) {
        this._vscodeWrapper.showWarningMessage(message);
    }
    // PUBLIC METHODS //////////////////////////////////////////////////////
    isRunningQuery(uri) {
        return !this._queryResultsMap.has(uri)
            ? false
            : this._queryResultsMap.get(uri).queryRunner.isExecutingQuery;
    }
    runQuery(statusView, uri, selection, title, executionPlanOptions, promise) {
        return __awaiter(this, void 0, void 0, function* () {
            // execute the query with a query runner
            yield this.runQueryCallback(statusView ? statusView : this._statusView, uri, title, (queryRunner) => __awaiter(this, void 0, void 0, function* () {
                if (queryRunner) {
                    if (this.shouldUseOldResultPane) {
                        // if the panel isn't active and exists
                        if (this._panels.get(uri).isActive === false) {
                            this._panels.get(uri).revealToForeground(uri);
                        }
                    }
                    yield queryRunner.runQuery(selection, executionPlanOptions, promise);
                }
            }), executionPlanOptions);
        });
    }
    runCurrentStatement(statusView, uri, selection, title) {
        return __awaiter(this, void 0, void 0, function* () {
            // execute the statement with a query runner
            yield this.runQueryCallback(statusView ? statusView : this._statusView, uri, title, (queryRunner) => {
                if (queryRunner) {
                    queryRunner.runStatement(selection.startLine, selection.startColumn);
                }
            });
        });
    }
    get isOpenQueryResultsInTabByDefaultEnabled() {
        return this._vscodeWrapper
            .getConfiguration()
            .get(Constants.configOpenQueryResultsInTabByDefault);
    }
    get isRichExperiencesEnabled() {
        return true;
    }
    get isNewQueryResultFeatureEnabled() {
        return true;
    }
    get shouldUseOldResultPane() {
        return !this.isRichExperiencesEnabled || !this.isNewQueryResultFeatureEnabled;
    }
    runQueryCallback(statusView, uri, title, queryCallback, executionPlanOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            let queryRunner = yield this.createQueryRunner(statusView ? statusView : this._statusView, uri, title);
            if (this.shouldUseOldResultPane) {
                if (this._panels.has(uri)) {
                    let panelController = this._panels.get(uri);
                    if (panelController.isDisposed) {
                        this._panels.delete(uri);
                        yield this.createWebviewController(uri, title, queryRunner);
                    }
                    else {
                        queryCallback(queryRunner);
                        return;
                    }
                }
                else {
                    yield this.createWebviewController(uri, title, queryRunner);
                }
            }
            else {
                if (executionPlanOptions) {
                    this._executionPlanOptions = executionPlanOptions;
                }
                else {
                    this._executionPlanOptions = {};
                }
                this._queryResultWebviewController.addQueryResultState(uri, title, this.getIsExecutionPlan(), (_b = (_a = this._executionPlanOptions) === null || _a === void 0 ? void 0 : _a.includeActualExecutionPlanXml) !== null && _b !== void 0 ? _b : false);
            }
            if (queryRunner) {
                queryCallback(queryRunner);
            }
        });
    }
    createWebviewController(uri, title, queryRunner) {
        return __awaiter(this, void 0, void 0, function* () {
            const proxy = {
                getRows: (batchId, resultId, rowStart, numberOfRows) => this.rowRequestHandler(uri, batchId, resultId, rowStart, numberOfRows),
                copyResults: (batchId, resultsId, selection, includeHeaders) => this.copyRequestHandler(uri, batchId, resultsId, selection, includeHeaders),
                getConfig: () => this.configRequestHandler(uri),
                getLocalizedTexts: () => Promise.resolve(LocalizedConstants),
                openLink: (content, columnName, linkType) => this.openLinkRequestHandler(content, columnName, linkType),
                saveResults: (batchId, resultId, format, selection) => this.saveResultsRequestHandler(uri, batchId, resultId, format, selection),
                setEditorSelection: (selection) => this.editorSelectionRequestHandler(uri, selection),
                showError: (message) => this.showErrorRequestHandler(message),
                showWarning: (message) => this.showWarningRequestHandler(message),
                sendReadyEvent: () => __awaiter(this, void 0, void 0, function* () { return yield this.sendReadyEvent(uri); }),
                dispose: () => this._panels.delete(uri),
                getNewColumnWidth: (current) => __awaiter(this, void 0, void 0, function* () {
                    const val = yield vscode.window.showInputBox({
                        prompt: LocalizedConstants.newColumnWidthPrompt,
                        value: current.toString(),
                        validateInput: (value) => __awaiter(this, void 0, void 0, function* () {
                            if (!Number(value)) {
                                return LocalizedConstants.columnWidthInvalidNumberError;
                            }
                            else if (parseInt(value, 10) <= 0) {
                                return LocalizedConstants.columnWidthMustBePositiveError;
                            }
                            return undefined;
                        }),
                    });
                    return val === undefined ? undefined : parseInt(val, 10);
                }),
                sendActionEvent: (view, action, properties, measurement) => {
                    (0, telemetry_1.sendActionEvent)(view, action, properties, measurement);
                },
            };
            const controller = new webviewController_1.WebviewPanelController(this._vscodeWrapper, uri, title, proxy, this.context.extensionPath, this._statusView);
            this._panels.set(uri, controller);
            yield controller.init();
        });
    }
    createQueryRunner(statusView, uri, title) {
        // Reuse existing query runner if it exists
        let queryRunner;
        if (this._queryResultsMap.has(uri)) {
            let existingRunner = this._queryResultsMap.get(uri).queryRunner;
            // If the query is already in progress, don't attempt to send it
            if (existingRunner.isExecutingQuery) {
                this._vscodeWrapper.showInformationMessage(LocalizedConstants.msgRunQueryInProgress);
                return;
            }
            // If the query is not in progress, we can reuse the query runner
            queryRunner = existingRunner;
            queryRunner.resetHasCompleted();
        }
        else {
            // We do not have a query runner for this editor, so create a new one
            // and map it to the results uri
            queryRunner = new queryRunner_1.default(uri, title, statusView ? statusView : this._statusView);
            queryRunner.eventEmitter.on("start", (panelUri) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                if (this.shouldUseOldResultPane) {
                    this._panels.get(uri).proxy.sendEvent("start", panelUri);
                    (0, telemetry_1.sendActionEvent)(telemetry_2.TelemetryViews.ResultsGrid, telemetry_2.TelemetryActions.OpenQueryResult);
                }
                else {
                    this._lastSendMessageTime = Date.now();
                    this._queryResultWebviewController.addQueryResultState(uri, title, this.getIsExecutionPlan(), (_b = (_a = this._executionPlanOptions) === null || _a === void 0 ? void 0 : _a.includeActualExecutionPlanXml) !== null && _b !== void 0 ? _b : false);
                    this._queryResultWebviewController.getQueryResultState(uri).tabStates.resultPaneTab = queryResult_1.QueryResultPaneTabs.Messages;
                    if (this.isOpenQueryResultsInTabByDefaultEnabled) {
                        yield this._queryResultWebviewController.createPanelController(uri);
                    }
                    this._queryResultWebviewController.updatePanelState(uri);
                    if (!this._queryResultWebviewController.hasPanel(uri)) {
                        yield this._queryResultWebviewController.revealToForeground();
                    }
                    (0, telemetry_1.sendActionEvent)(telemetry_2.TelemetryViews.QueryResult, telemetry_2.TelemetryActions.OpenQueryResult, {
                        defaultLocation: this.isOpenQueryResultsInTabByDefaultEnabled
                            ? "tab"
                            : "pane",
                    });
                }
            }));
            queryRunner.eventEmitter.on("resultSet", (resultSet) => __awaiter(this, void 0, void 0, function* () {
                if (this.shouldUseOldResultPane) {
                    this._panels.get(uri).proxy.sendEvent("resultSet", resultSet);
                }
                else {
                    this._queryResultWebviewController.addResultSetSummary(uri, resultSet);
                    this._queryResultWebviewController.updatePanelState(uri);
                }
            }));
            queryRunner.eventEmitter.on("batchStart", (batch) => __awaiter(this, void 0, void 0, function* () {
                let time = new Date().toLocaleTimeString();
                if (batch.executionElapsed && batch.executionEnd) {
                    time = new Date(batch.executionStart).toLocaleTimeString();
                }
                // Build a message for the selection and send the message
                // from the webview
                let message = {
                    message: LocalizedConstants.runQueryBatchStartMessage,
                    selection: batch.selection,
                    isError: false,
                    time: time,
                    link: {
                        text: LocalizedConstants.runQueryBatchStartLine(batch.selection.startLine + 1),
                        uri: uri,
                    },
                };
                if (this.shouldUseOldResultPane) {
                    this._panels.get(uri).proxy.sendEvent("message", message);
                }
                else {
                    this._queryResultWebviewController
                        .getQueryResultState(uri)
                        .messages.push(message);
                    this._queryResultWebviewController.getQueryResultState(uri).tabStates.resultPaneTab = queryResult_1.QueryResultPaneTabs.Messages;
                    this._queryResultWebviewController.state =
                        this._queryResultWebviewController.getQueryResultState(uri);
                    this._queryResultWebviewController.queueStateUpdate(uri);
                    this._queryResultWebviewController.updatePanelState(uri);
                    if (!this._queryResultWebviewController.hasPanel(uri)) {
                        yield this._queryResultWebviewController.revealToForeground();
                    }
                }
            }));
            queryRunner.eventEmitter.on("message", (message) => __awaiter(this, void 0, void 0, function* () {
                if (this.shouldUseOldResultPane) {
                    this._panels.get(uri).proxy.sendEvent("message", message);
                }
                else {
                    this._queryResultWebviewController
                        .getQueryResultState(uri)
                        .messages.push(message);
                    // Set state for messages at fixed intervals to avoid spamming the webview
                    if (this._lastSendMessageTime < Date.now() - MESSAGE_INTERVAL_IN_MS) {
                        this._queryResultWebviewController.getQueryResultState(uri).tabStates.resultPaneTab = queryResult_1.QueryResultPaneTabs.Messages;
                        this._queryResultWebviewController.state =
                            this._queryResultWebviewController.getQueryResultState(uri);
                        this._queryResultWebviewController.queueStateUpdate(uri);
                        this._queryResultWebviewController.updatePanelState(uri);
                        if (!this._queryResultWebviewController.hasPanel(uri)) {
                            yield this._queryResultWebviewController.revealToForeground();
                        }
                        this._lastSendMessageTime = Date.now();
                    }
                }
            }));
            queryRunner.eventEmitter.on("complete", (totalMilliseconds, hasError, isRefresh) => __awaiter(this, void 0, void 0, function* () {
                if (!isRefresh) {
                    // only update query history with new queries
                    this._vscodeWrapper.executeCommand(Constants.cmdRefreshQueryHistory, uri, hasError);
                }
                if (this.shouldUseOldResultPane) {
                    this._panels.get(uri).proxy.sendEvent("complete", totalMilliseconds);
                }
                else {
                    this._queryResultWebviewController.getQueryResultState(uri).messages.push({
                        message: LocalizedConstants.elapsedTimeLabel(totalMilliseconds),
                        isError: false, // Elapsed time messages are never displayed as errors
                    });
                    // if there is an error, show the error message and set the tab to the messages tab
                    let tabState;
                    if (hasError) {
                        tabState = queryResult_1.QueryResultPaneTabs.Messages;
                    }
                    else {
                        tabState =
                            Object.keys(this._queryResultWebviewController.getQueryResultState(uri)
                                .resultSetSummaries).length > 0
                                ? queryResult_1.QueryResultPaneTabs.Results
                                : queryResult_1.QueryResultPaneTabs.Messages;
                    }
                    this._queryResultWebviewController.getQueryResultState(uri).tabStates.resultPaneTab = tabState;
                    this._queryResultWebviewController.state =
                        this._queryResultWebviewController.getQueryResultState(uri);
                    this._queryResultWebviewController.queueStateUpdate(uri);
                    this._queryResultWebviewController.updatePanelState(uri);
                    if (!this._queryResultWebviewController.hasPanel(uri)) {
                        yield this._queryResultWebviewController.revealToForeground();
                    }
                }
            }));
            this._queryResultsMap.set(uri, new QueryRunnerState(queryRunner));
        }
        return queryRunner;
    }
    cancelQuery(input) {
        let self = this;
        let queryRunner;
        if (typeof input === "string") {
            if (this._queryResultsMap.has(input)) {
                // Option 1: The string is a results URI (the results tab has focus)
                queryRunner = this._queryResultsMap.get(input).queryRunner;
            }
        }
        else {
            queryRunner = input;
        }
        if (queryRunner === undefined || !queryRunner.isExecutingQuery) {
            self._vscodeWrapper.showInformationMessage(LocalizedConstants.msgCancelQueryNotRunning);
            return;
        }
        // Switch the spinner to canceling, which will be reset when the query execute sends back its completed event
        this._statusView.cancelingQuery(queryRunner.uri);
        // Cancel the query
        queryRunner.cancel().then((success) => undefined, (error) => {
            // On error, show error message
            self._vscodeWrapper.showErrorMessage(LocalizedConstants.msgCancelQueryFailed(error.message));
        });
    }
    /**
     * Executed from the MainController when an untitled text document was saved to the disk. If
     * any queries were executed from the untitled document, the queryrunner will be remapped to
     * a new resuls uri based on the uri of the newly saved file.
     * @param untitledUri   The URI of the untitled file
     * @param savedUri  The URI of the file after it was saved
     */
    onUntitledFileSaved(untitledUri, savedUri) {
        // If we don't have any query runners mapped to this uri, don't do anything
        let untitledResultsUri = decodeURIComponent(untitledUri);
        if (!this._queryResultsMap.has(untitledResultsUri)) {
            return;
        }
        // NOTE: We don't need to remap the query in the service because the queryrunner still has
        // the old uri. As long as we make requests to the service against that uri, we'll be good.
        // Remap the query runner in the map
        let savedResultUri = decodeURIComponent(savedUri);
        this._queryResultsMap.set(savedResultUri, this._queryResultsMap.get(untitledResultsUri));
        this._queryResultsMap.delete(untitledResultsUri);
    }
    /**
     * Executed from the MainController when a text document (that already exists on disk) was
     * closed. If the query is in progress, it will be canceled. If there is a query at all,
     * the query will be disposed.
     * @param doc   The document that was closed
     */
    onDidCloseTextDocument(docUri) {
        for (let [key, value] of this._queryResultsMap.entries()) {
            // closes text document related to a results window we are holding
            if (docUri === value.queryRunner.uri) {
                value.flaggedForDeletion = true;
            }
            // "closes" a results window we are holding
            if (docUri === key) {
                value.timeout = this.setRunnerDeletionTimeout(key);
            }
        }
    }
    /**
     * Ready event sent by the angular app
     * @param uri
     */
    sendReadyEvent(uri) {
        return __awaiter(this, void 0, void 0, function* () {
            const panelController = this._panels.get(uri);
            const queryRunner = this.getQueryRunner(uri);
            // in case of a tab switch
            // and if it has rendered before
            if (panelController.isActive !== undefined &&
                queryRunner.hasCompleted &&
                panelController.rendered) {
                return queryRunner.refreshQueryTab(uri);
            }
            else {
                // first ready event
                panelController.rendered = true;
            }
            return false;
        });
    }
    setRunnerDeletionTimeout(uri) {
        const self = this;
        return setTimeout(() => {
            let queryRunnerState = self._queryResultsMap.get(uri);
            if (!queryRunnerState) {
                // Guard: queryRunnerState may be undefined if already deleted
                return;
            }
            if (queryRunnerState.flaggedForDeletion) {
                self._queryResultsMap.delete(uri);
                if (queryRunnerState.queryRunner.isExecutingQuery) {
                    // We need to cancel it, which will dispose it
                    this.cancelQuery(queryRunnerState.queryRunner);
                }
                else {
                    // We need to explicitly dispose the query
                    void queryRunnerState.queryRunner.dispose();
                }
            }
            else {
                queryRunnerState.timeout = this.setRunnerDeletionTimeout(uri);
            }
        }, deletionTimeoutTime);
    }
    /**
     * Open a xml/json link - Opens the content in a new editor pane
     */
    openLink(content, columnName, linkType) {
        const self = this;
        if (linkType === "xml") {
            try {
                content = pd.xml(content);
            }
            catch (e) {
                // If Xml fails to parse, fall back on original Xml content
            }
        }
        else if (linkType === "json") {
            let jsonContent = undefined;
            try {
                jsonContent = JSON.parse(content);
            }
            catch (e) {
                // If Json fails to parse, fall back on original Json content
            }
            if (jsonContent) {
                // If Json content was valid and parsed, pretty print content to a string
                content = JSON.stringify(jsonContent, undefined, 4);
            }
        }
        vscode.workspace.openTextDocument({ language: linkType }).then((doc) => {
            vscode.window.showTextDocument(doc, 2, false).then((editor) => {
                editor
                    .edit((edit) => {
                    edit.insert(new vscode.Position(0, 0), content);
                })
                    .then((result) => {
                    if (!result) {
                        self._vscodeWrapper.showErrorMessage(LocalizedConstants.msgCannotOpenContent);
                    }
                });
            }, (error) => {
                self._vscodeWrapper.showErrorMessage(error);
            });
        }, (error) => {
            self._vscodeWrapper.showErrorMessage(error);
        });
    }
    /**
     * Return the query for a file uri
     */
    getQueryRunner(uri) {
        if (this._queryResultsMap.has(uri)) {
            return this._queryResultsMap.get(uri).queryRunner;
        }
        else {
            return undefined;
        }
    }
    getIsExecutionPlan() {
        var _a, _b, _c, _d;
        return (((_b = (_a = this._executionPlanOptions) === null || _a === void 0 ? void 0 : _a.includeEstimatedExecutionPlanXml) !== null && _b !== void 0 ? _b : false) ||
            ((_d = (_c = this._executionPlanOptions) === null || _c === void 0 ? void 0 : _c.includeActualExecutionPlanXml) !== null && _d !== void 0 ? _d : false));
    }
    /**
     * Switches SQLCMD Mode to on/off
     * @param queryUri Uri of the query
     */
    toggleSqlCmd(uri) {
        const queryRunner = this.getQueryRunner(uri);
        if (queryRunner) {
            return queryRunner.toggleSqlCmd().then((result) => {
                return result;
            });
        }
        return Promise.resolve(false);
    }
    // PRIVATE HELPERS /////////////////////////////////////////////////////
    /**
     * Returns which column should be used for a new result pane
     * @return ViewColumn to be used
     * public for testing purposes
     */
    newResultPaneViewColumn(queryUri) {
        // Find configuration options
        let config = this._vscodeWrapper.getConfiguration(Constants.extensionConfigSectionName, queryUri);
        let splitPaneSelection = config[Constants.configSplitPaneSelection];
        let viewColumn;
        switch (splitPaneSelection) {
            case "current":
                viewColumn = this._vscodeWrapper.activeTextEditor.viewColumn;
                break;
            case "end":
                viewColumn = vscode.ViewColumn.Three;
                break;
            // default case where splitPaneSelection is next or anything else
            default:
                if (this._vscodeWrapper.activeTextEditor.viewColumn === vscode.ViewColumn.One) {
                    viewColumn = vscode.ViewColumn.Two;
                }
                else {
                    viewColumn = vscode.ViewColumn.Three;
                }
        }
        return viewColumn;
    }
    set setVscodeWrapper(wrapper) {
        this._vscodeWrapper = wrapper;
    }
    get getResultsMap() {
        return this._queryResultsMap;
    }
    set setResultsMap(setMap) {
        this._queryResultsMap = setMap;
    }
}
exports.SqlOutputContentProvider = SqlOutputContentProvider;

//# sourceMappingURL=sqlOutputContentProvider.js.map
