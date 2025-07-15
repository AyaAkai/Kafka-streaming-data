"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReactflowInstanceHook = exports.ReactFlowHandle = void 0;
const react_1 = require("@xyflow/react");
exports.ReactFlowHandle = {};
const ReactflowInstanceHook = () => {
    exports.ReactFlowHandle.instance = (0, react_1.useReactFlow)();
    exports.ReactFlowHandle.store = (0, react_1.useStoreApi)();
    return undefined;
};
exports.ReactflowInstanceHook = ReactflowInstanceHook;

//# sourceMappingURL=reactFlowInstance.js.map
