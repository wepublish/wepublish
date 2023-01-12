"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemberPlanSort = exports.AllPaymentPeriodicity = void 0;
const client_1 = require("@prisma/client");
exports.AllPaymentPeriodicity = [
    client_1.PaymentPeriodicity.monthly,
    client_1.PaymentPeriodicity.quarterly,
    client_1.PaymentPeriodicity.biannual,
    client_1.PaymentPeriodicity.yearly
];
var MemberPlanSort;
(function (MemberPlanSort) {
    MemberPlanSort["CreatedAt"] = "modifiedAt";
    MemberPlanSort["ModifiedAt"] = "modifiedAt";
})(MemberPlanSort = exports.MemberPlanSort || (exports.MemberPlanSort = {}));
//# sourceMappingURL=memberPlan.js.map