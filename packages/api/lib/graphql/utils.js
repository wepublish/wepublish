"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapDateFilterToPrisma = void 0;
const common_1 = require("../db/common");
const mapDateFilterToPrisma = (comparison) => {
    return comparison === common_1.DateFilterComparison.Equal ? 'equals' : comparison;
};
exports.mapDateFilterToPrisma = mapDateFilterToPrisma;
//# sourceMappingURL=utils.js.map