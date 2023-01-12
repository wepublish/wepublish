"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DateFilterComparison = exports.MaxResultsPerPage = exports.DefaultBcryptHashCostFactor = exports.DefaultSessionTTL = exports.SortOrder = void 0;
var SortOrder;
(function (SortOrder) {
    SortOrder[SortOrder["Ascending"] = 1] = "Ascending";
    SortOrder[SortOrder["Descending"] = -1] = "Descending";
})(SortOrder = exports.SortOrder || (exports.SortOrder = {}));
exports.DefaultSessionTTL = 1000 * 60 * 60 * 24 * 7; // 1w
exports.DefaultBcryptHashCostFactor = 11;
exports.MaxResultsPerPage = 100;
var DateFilterComparison;
(function (DateFilterComparison) {
    DateFilterComparison["GreaterThan"] = "gt";
    DateFilterComparison["GreaterThanOrEqual"] = "gte";
    DateFilterComparison["Equal"] = "eq";
    DateFilterComparison["LowerThan"] = "lt";
    DateFilterComparison["LowerThanOrEqual"] = "lte";
})(DateFilterComparison = exports.DateFilterComparison || (exports.DateFilterComparison = {}));
//# sourceMappingURL=common.js.map