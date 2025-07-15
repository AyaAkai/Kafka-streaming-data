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
exports.DockerHelpers = void 0;
const vscode = require("vscode");
const vscode_container_client_1 = require("@microsoft/vscode-container-client");
const taskWrapper_1 = require("../utils/taskWrapper");
const constants_1 = require("../constants/constants");
const path = require("node:path");
var DockerHelpers;
(function (DockerHelpers) {
    const dockerClient = new vscode_container_client_1.DockerClient();
    function checkRuntime() {
        return __awaiter(this, void 0, void 0, function* () {
            const runtimeCommand = yield dockerClient.checkInstall({});
            const runtimeShellExecution = new vscode.ShellExecution(runtimeCommand.command, runtimeCommand.args);
            return (0, taskWrapper_1.taskExecWrapper)(runtimeShellExecution, "Docker Runtime check", true)
                .then((exitCode) => {
                return exitCode === 0;
            })
                .catch(() => {
                return false;
            });
        });
    }
    DockerHelpers.checkRuntime = checkRuntime;
    function checkService() {
        return __awaiter(this, void 0, void 0, function* () {
            const listContainersCommand = yield dockerClient.listContainers({});
            const listContainersExecution = new vscode.ShellExecution(listContainersCommand.command, listContainersCommand.args);
            return (0, taskWrapper_1.taskExecWrapper)(listContainersExecution, "Docker Service check", true)
                .then((exitCode) => {
                return exitCode === 0;
            })
                .catch(() => {
                return false;
            });
        });
    }
    DockerHelpers.checkService = checkService;
    function constructImageRef(registry, imgName, imgVer) {
        let imageRef = imgName ? imgName : constants_1.DockerConstants.dockerImageBasename;
        imageRef = path.posix.join(registry ? registry : "", imageRef);
        imageRef = imageRef + (imgVer ? ":" + imgVer : "");
        return imageRef;
    }
    DockerHelpers.constructImageRef = constructImageRef;
    function startContainer(containerName) {
        return __awaiter(this, void 0, void 0, function* () {
            const dockerStartCommand = yield dockerClient.startContainers({
                container: [containerName],
            });
            const dockerStartShellExecution = new vscode.ShellExecution(dockerStartCommand.command, dockerStartCommand.args);
            return (0, taskWrapper_1.taskExecWrapper)(dockerStartShellExecution, "Start container " + containerName, false);
        });
    }
    DockerHelpers.startContainer = startContainer;
    function runContainer(containerOpsWithPlatform) {
        return __awaiter(this, void 0, void 0, function* () {
            const dockerRunCommand = yield dockerClient.runContainer(containerOpsWithPlatform);
            // The order of the final arguments in the command array are guaranteed:
            // [-3] customOptions, if provided in RunContainerCommandOptions
            // [-2] imageRef, required in RunContainerCommandOptions
            // [-1] command, if provided in RunContainerCommandOptions
            // Use this guarantee to inject our platform flag, if provided
            // TODO: expand implementation to allow safely injecting addl user args
            const imageRefArgIdx = dockerRunCommand.args.length - (containerOpsWithPlatform.command ? 2 : 1);
            const platformArgs = containerOpsWithPlatform.platform
                ? [
                    "--platform",
                    {
                        value: containerOpsWithPlatform.platform,
                        quoting: vscode.ShellQuoting.Strong,
                    },
                ]
                : [];
            const dockerRunShellExecution = new vscode.ShellExecution(dockerRunCommand.command, [
                ...dockerRunCommand.args.slice(0, imageRefArgIdx),
                ...platformArgs,
                dockerRunCommand.args[dockerRunCommand.args.length - 1],
            ]);
            return (0, taskWrapper_1.taskExecWrapper)(dockerRunShellExecution, "Run container " + containerOpsWithPlatform.name, false);
        });
    }
    DockerHelpers.runContainer = runContainer;
    function checkContainerExists(containerName, hide) {
        return __awaiter(this, void 0, void 0, function* () {
            const inspectContainerCommand = yield dockerClient.inspectContainers({
                containers: [containerName],
            });
            const inspectContainerExecution = new vscode.ShellExecution(inspectContainerCommand.command, inspectContainerCommand.args);
            return (0, taskWrapper_1.taskExecWrapper)(inspectContainerExecution, "Docker Container Created Check", true, hide)
                .then((exitCode) => {
                return exitCode === 0;
            })
                .catch(() => {
                return false;
            });
        });
    }
    DockerHelpers.checkContainerExists = checkContainerExists;
    function waitDbContainerReady(containerName_1) {
        return __awaiter(this, arguments, void 0, function* (containerName, timeoutMs = constants_1.DockerConstants.dockerReadyCheckTimeoutMs) {
            const t_start = Date.now();
            while (true) {
                if (yield checkDbContainerReady(containerName)) {
                    return true;
                }
                if (Date.now() >= t_start + timeoutMs) {
                    return false;
                }
                yield new Promise((resolve) => {
                    setTimeout(resolve, constants_1.DockerConstants.dockerReadyCheckIntervalMs);
                });
            }
        });
    }
    DockerHelpers.waitDbContainerReady = waitDbContainerReady;
    function checkDbContainerReady(containerName) {
        return __awaiter(this, void 0, void 0, function* () {
            const containerCheckCommand = yield dockerClient.execContainer({
                command: constants_1.DockerConstants.pgCheckDbReadyCmd,
                container: containerName,
            });
            const containerCheckShellExecution = new vscode.ShellExecution(containerCheckCommand.command, containerCheckCommand.args);
            return (0, taskWrapper_1.taskExecWrapper)(containerCheckShellExecution, "Docker Container Ready Check", true)
                .then((exitCode) => {
                return exitCode === 0;
            })
                .catch(() => {
                return false;
            });
        });
    }
    DockerHelpers.checkDbContainerReady = checkDbContainerReady;
    function getDbBoundPort(containerName) {
        return __awaiter(this, void 0, void 0, function* () {
            const portCommand = yield dockerClient.inspectContainers({
                containers: [containerName],
            });
            return (0, taskWrapper_1.shellExecWrapper)(portCommand.command, portCommand.args)
                .then(([error, stdout, _]) => {
                if (error) {
                    /* TODO: Use `stderr` to be more helpful */
                    return -1;
                }
                try {
                    const containerInfo = JSON.parse(stdout);
                    const portConfig = containerInfo.NetworkSettings.Ports;
                    /* There should only ever be one bound port, with this exact label */
                    // eslint-disable-next-line prettier/prettier
                    return +portConfig[constants_1.DockerConstants.portBindLabel][0].HostPort;
                }
                catch (_a) {
                    return -1;
                }
            })
                .catch(() => {
                return -1;
            });
        });
    }
    DockerHelpers.getDbBoundPort = getDbBoundPort;
})(DockerHelpers || (exports.DockerHelpers = DockerHelpers = {}));

//# sourceMappingURL=helpers.js.map
