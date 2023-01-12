"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActiveMemberPlans = void 0;
const member_plan_queries_1 = require("./member-plan.queries");
const getActiveMemberPlans = async (filter, sortedField, order, cursorId, skip, take, memberPlan) => (0, member_plan_queries_1.getMemberPlans)(Object.assign(Object.assign({}, filter), { active: true }), sortedField, order, cursorId, skip, take, memberPlan);
exports.getActiveMemberPlans = getActiveMemberPlans;
//# sourceMappingURL=member-plan.public-queries.js.map