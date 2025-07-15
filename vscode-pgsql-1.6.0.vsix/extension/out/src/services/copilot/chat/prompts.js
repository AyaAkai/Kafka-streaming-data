"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.rewriteQuerySelectionPrompt = exports.rewriteQueryPrompt = exports.explainQuerySelectionPrompt = exports.explainQueryPrompt = exports.analyzeQueryPerformancePrompt = exports.genericChatStart = void 0;
const Constants = require("../../../constants/constants");
exports.genericChatStart = `@${Constants.chatParticipantHandle} Hello!`;
exports.analyzeQueryPerformancePrompt = `@${Constants.chatParticipantHandle} Analyze the performance of this query. ` +
    "Provide a detailed analysis, including a summary of the execution plan, " +
    "potential bottlenecks, and suggestions for optimization. " +
    "Make sure to highlight any relevant statistics or metrics that can help in understanding the performance characteristics of the query. " +
    "Run EXPLAIN and/or EXPLAIN ANALYZE on the query to get the execution plan and performance metrics. " +
    "If the query is complex, break down the analysis into smaller parts for better clarity. " +
    "Provide a summary of the key findings and recommendations at the end of the analysis.";
exports.explainQueryPrompt = `@${Constants.chatParticipantHandle} Explain this query. ` +
    "Provide a detailed explanation of the query's purpose, business logic, structure, and functionality. " +
    "Make sure to clarify the role of each part of the query and how they contribute to the overall result. " +
    "Provide examples or analogies if necessary to help me understand the query better.";
exports.explainQuerySelectionPrompt = `@${Constants.chatParticipantHandle} Explain the selected text of this query. ` +
    "Provide a detailed explanation of the query's purpose, business logic, structure, and functionality in the context of the query " +
    "it is a part of.";
exports.rewriteQueryPrompt = `@${Constants.chatParticipantHandle} Rewrite this query. ` +
    "Provide a revised version of the query that provides optimal performance, readability, or maintainability. " +
    "Use the database context to ensure correctness. Think hard to find the absolute best version of the query. " +
    "Make sure to explain the changes made and the reasons behind them. " +
    "If applicable, include any relevant statistics or metrics that can help in understanding the performance characteristics of the revised query. " +
    "If the text contains multiple queries, rewrite each query separately. " +
    "If the query is already optimal, please let me know that as well.";
exports.rewriteQuerySelectionPrompt = `@${Constants.chatParticipantHandle} Rewrite the selected text of this query. ` +
    "Provide a revised version of the selected text that improves its performance, readability, or maintainability. " +
    "Use the database context to ensure correctness. Think hard to find the absolute best version of the query. " +
    "Make sure to explain the changes made and the reasons behind them. " +
    "If applicable, include any relevant statistics or metrics that can help in understanding the performance characteristics of the revised query.";

//# sourceMappingURL=prompts.js.map
