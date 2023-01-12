"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMemberPlans = exports.createMemberPlanFilter = exports.createMemberPlanOrder = void 0;
const common_1 = require("../../db/common");
const memberPlan_1 = require("../../db/memberPlan");
const sort_1 = require("../queries/sort");
const createMemberPlanOrder = (field, sortOrder) => {
    switch (field) {
        case memberPlan_1.MemberPlanSort.CreatedAt:
            return {
                createdAt: sortOrder
            };
        case memberPlan_1.MemberPlanSort.ModifiedAt:
            return {
                modifiedAt: sortOrder
            };
    }
};
exports.createMemberPlanOrder = createMemberPlanOrder;
const createNameFilter = (filter) => {
    if (filter === null || filter === void 0 ? void 0 : filter.name) {
        return {
            name: filter.name
        };
    }
    return {};
};
const createActiveFilter = (filter) => {
    if ((filter === null || filter === void 0 ? void 0 : filter.active) != null) {
        return {
            active: filter.active
        };
    }
    return {};
};
const createTagsFilter = (filter) => {
    if (filter === null || filter === void 0 ? void 0 : filter.tags) {
        return {
            tags: {
                hasSome: filter.tags
            }
        };
    }
    return {};
};
const createMemberPlanFilter = (filter) => ({
    AND: [createNameFilter(filter), createActiveFilter(filter), createTagsFilter(filter)]
});
exports.createMemberPlanFilter = createMemberPlanFilter;
const getMemberPlans = async (filter, sortedField, order, cursorId, skip, take, memberPlan) => {
    const orderBy = (0, exports.createMemberPlanOrder)(sortedField, (0, sort_1.getSortOrder)(order));
    const where = (0, exports.createMemberPlanFilter)(filter);
    const [totalCount, memberplans] = await Promise.all([
        memberPlan.count({
            where,
            orderBy
        }),
        memberPlan.findMany({
            where,
            skip,
            take: Math.min(take, common_1.MaxResultsPerPage) + 1,
            orderBy,
            cursor: cursorId ? { id: cursorId } : undefined,
            include: {
                availablePaymentMethods: true
            }
        })
    ]);
    const nodes = memberplans.slice(0, take);
    const firstMemberPlan = nodes[0];
    const lastMemberPlan = nodes[nodes.length - 1];
    const hasPreviousPage = Boolean(skip);
    const hasNextPage = memberplans.length > nodes.length;
    return {
        nodes,
        totalCount,
        pageInfo: {
            hasPreviousPage,
            hasNextPage,
            startCursor: firstMemberPlan === null || firstMemberPlan === void 0 ? void 0 : firstMemberPlan.id,
            endCursor: lastMemberPlan === null || lastMemberPlan === void 0 ? void 0 : lastMemberPlan.id
        }
    };
};
exports.getMemberPlans = getMemberPlans;
//# sourceMappingURL=member-plan.queries.js.map