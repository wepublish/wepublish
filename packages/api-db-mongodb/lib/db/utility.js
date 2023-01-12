"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapDateFilterComparisonToMongoQueryOperatior = void 0;
const api_1 = require("@wepublish/api");
function mapDateFilterComparisonToMongoQueryOperatior(operator) {
    switch (operator) {
        case api_1.DateFilterComparison.GreaterThan:
            return '$gt';
        case api_1.DateFilterComparison.GreaterThanOrEqual:
            return '$gte';
        case api_1.DateFilterComparison.Equal:
            return '$eq';
        case api_1.DateFilterComparison.LowerThan:
            return '$lt';
        case api_1.DateFilterComparison.LowerThanOrEqual:
            return '$lte';
        default:
            throw new Error('Unknown DateFilterComparison');
    }
}
exports.mapDateFilterComparisonToMongoQueryOperatior = mapDateFilterComparisonToMongoQueryOperatior;
//# sourceMappingURL=utility.js.map