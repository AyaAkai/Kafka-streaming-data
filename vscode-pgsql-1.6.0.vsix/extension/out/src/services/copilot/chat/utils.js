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
exports.wrapText = wrapText;
exports.streamMarkdown = streamMarkdown;
exports.hashPrompt = hashPrompt;
exports.toCopilotAccessCode = toCopilotAccessCode;
const crypto_1 = require("crypto");
const messages_1 = require("./messages");
/**
 * Wraps the given text to a specified width and adds a prefix to each line.
 *
 * @param text - The text to be wrapped.
 * @param width - The maximum width of each line before wrapping.
 * @param prefix - The prefix to add to each line. Default is "-- ".
 * @param hangingIndent - The number of spaces to indent each line besides the first, after the prefix.
 * @returns The wrapped text with the specified prefix added to each line.
 */
function wrapText(text, width, prefix = "-- ", hangingIndent = 0) {
    const regex = new RegExp(`(.{1,${width}})(\\s|$)`, "g");
    const lines = text.match(regex) || [text];
    const indentSpaces = " ".repeat(hangingIndent);
    const indentedPrefix = prefix + indentSpaces;
    return lines
        .map((line, index) => (index === 0 ? prefix + line.trim() : indentedPrefix + line.trim()))
        .join("\n");
}
function streamMarkdown(content_1, stream_1) {
    return __awaiter(this, arguments, void 0, function* (content, stream, delayMs = 30, chunkSize = 50) {
        for (let i = 0; i < content.length; i += chunkSize) {
            const chunk = content.substring(i, i + chunkSize);
            stream.markdown(chunk);
            yield new Promise((resolve) => setTimeout(resolve, delayMs));
        }
    });
}
function hashPrompt(prompt) {
    // Create a SHA-256 hash of the prompt for caching purposes
    return (0, crypto_1.createHash)("sha256").update(prompt).digest("hex");
}
function toCopilotAccessCode(value) {
    if (value === undefined) {
        return undefined;
    }
    if (Object.values(messages_1.CopilotAccessMode).includes(value)) {
        return value;
    }
    return undefined;
}

//# sourceMappingURL=utils.js.map
