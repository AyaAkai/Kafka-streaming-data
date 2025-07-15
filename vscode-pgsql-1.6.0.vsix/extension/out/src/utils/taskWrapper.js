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
exports.taskExecWrapper = taskExecWrapper;
exports.shellExecWrapper = shellExecWrapper;
exports.getQuotedString = getQuotedString;
const vscode = require("vscode");
const cp = require("child_process");
function taskExecWrapper(exec, taskName, rejectOnError, hide) {
    return __awaiter(this, void 0, void 0, function* () {
        const task = new vscode.Task({ type: "shell" }, vscode.TaskScope.Workspace, taskName, "vs-code-postgresql", exec, []);
        task.presentationOptions.focus = !hide;
        const taskExecution = yield vscode.tasks.executeTask(task);
        const taskEndPromise = new Promise((resolve, reject) => {
            const disposable = vscode.tasks.onDidEndTaskProcess((e) => {
                if (e.execution === taskExecution) {
                    disposable.dispose();
                    if (e.exitCode && rejectOnError) {
                        reject(e.exitCode);
                    }
                    resolve(e.exitCode);
                }
            });
        });
        return taskEndPromise;
    });
}
/* I apologize in advance for my transgressions */
/* TODO: Should link this to a terminal session */
function shellExecWrapper(cmd, args, rejectOnError) {
    return __awaiter(this, void 0, void 0, function* () {
        const _cmd = cmd + (args ? " " + getQuotedString(args).join(" ") : "");
        return new Promise((resolve, reject) => {
            cp.exec(_cmd, (error, stdout, stderr) => {
                if (error && rejectOnError) {
                    reject(error.code);
                    return;
                }
                resolve([error ? error.code : 0, stdout, stderr]);
            });
        });
    });
}
/* Seems _REALLY_ strange to me that there isn't a built in utility to do this already? */
/* This should be reviewed with a fine tooth comb to validate the escaping - just in case */
function getQuotedString(shellQuotedString) {
    return shellQuotedString.map((v) => {
        if (typeof v === "string") {
            return v;
        }
        switch (v.quoting) {
            case vscode.ShellQuoting.Escape:
                return v.value.replace(/(["\s'$`\\])/g, "\\$1");
            case vscode.ShellQuoting.Weak:
                return `'${v.value.replace(/'/g, "'\\''")}'`;
            case vscode.ShellQuoting.Strong:
                return `"${v.value.replace(/(["\\$`])/g, "\\$1")}"`;
            default:
                return v.value;
        }
    });
}

//# sourceMappingURL=taskWrapper.js.map
