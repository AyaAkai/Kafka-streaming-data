"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("@griffel/react");
/**
 * Styles for a grid layout with 12 columns, responsive design, and utility
 * classes for centered content.
 */
const useGridStyles = (0, react_1.makeStyles)({
    container: {
        // 12 column grid with flexible width, minimum 60px per column
        display: "grid",
        gridTemplateColumns: "repeat(12, minmax(60px, 1fr))",
        columnGap: "16px",
        // Horizontal scroll for narrow screens, no vertical scroll
        overflowX: "auto",
        overflowY: "auto",
        // Vertical spacing between rows, if multiple rows of content:
        rowGap: "16px",
        height: "100%",
        alignContent: "start",
    },
    // Utility classes for defined content width (centered columns)
    center10: { gridColumn: "2 / span 10" },
    center6: { gridColumn: "4 / span 6" },
    center4: { gridColumn: "5 / span 4" },
    // Utility class for dynamic grid item placement
    gridItem: {
        gridColumn: "var(--grid-start) / span var(--grid-span)",
        boxSizing: "border-box",
    },
});
exports.default = useGridStyles;

//# sourceMappingURL=useGridStyles.js.map
