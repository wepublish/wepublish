"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminMemberPlans = exports.getMemberPlanByIdOrSlug = void 0;
const error_1 = require("../../error");
const permissions_1 = require("../permissions");
const member_plan_queries_1 = require("./member-plan.queries");
const getMemberPlanByIdOrSlug = (id, slug, authenticate, memberPlansByID, memberPlansBySlug) => {
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanGetMemberPlan, roles);
    if ((!id && !slug) || (id && slug)) {
        throw new error_1.UserInputError('You must provide either `id` or `slug`.');
    }
    return id ? memberPlansByID.load(id) : memberPlansBySlug.load(slug);
};
exports.getMemberPlanByIdOrSlug = getMemberPlanByIdOrSlug;
const getAdminMemberPlans = async (filter, sortedField, order, cursorId, skip, take, authenticate, memberPlan) => {
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanGetMemberPlans, roles);
    return (0, member_plan_queries_1.getMemberPlans)(filter, sortedField, order, cursorId, skip, take, memberPlan);
};
exports.getAdminMemberPlans = getAdminMemberPlans;
//# sourceMappingURL=member-plan.private-queries.js.map