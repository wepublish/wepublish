"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSubscriptions = exports.createSubscriptionFilter = exports.createSubscriptionOrder = void 0;
const common_1 = require("../../db/common");
const subscription_1 = require("../../db/subscription");
const sort_1 = require("../queries/sort");
const utils_1 = require("../utils");
const createSubscriptionOrder = (field, sortOrder) => {
    switch (field) {
        case subscription_1.SubscriptionSort.CreatedAt:
            return {
                createdAt: sortOrder
            };
        case subscription_1.SubscriptionSort.ModifiedAt:
            return {
                modifiedAt: sortOrder
            };
    }
};
exports.createSubscriptionOrder = createSubscriptionOrder;
const createStartsAtFromFilter = (filter) => {
    if (filter === null || filter === void 0 ? void 0 : filter.startsAtFrom) {
        const { comparison, date } = filter.startsAtFrom;
        const compare = (0, utils_1.mapDateFilterToPrisma)(comparison);
        return {
            startsAt: {
                [compare]: date
            }
        };
    }
    return {};
};
const createStartsAtToFilter = (filter) => {
    if (filter === null || filter === void 0 ? void 0 : filter.startsAtTo) {
        const { comparison, date } = filter.startsAtTo;
        const compare = (0, utils_1.mapDateFilterToPrisma)(comparison);
        return {
            startsAt: {
                [compare]: date
            }
        };
    }
    return {};
};
const createPaidUntilFromFilter = (filter) => {
    if (filter === null || filter === void 0 ? void 0 : filter.paidUntilFrom) {
        const { comparison, date } = filter.paidUntilFrom;
        const compare = (0, utils_1.mapDateFilterToPrisma)(comparison);
        return {
            paidUntil: {
                [compare]: date
            }
        };
    }
    return {};
};
const createPaidUntilToFilter = (filter) => {
    if (filter === null || filter === void 0 ? void 0 : filter.paidUntilTo) {
        const { comparison, date } = filter.paidUntilTo;
        const compare = (0, utils_1.mapDateFilterToPrisma)(comparison);
        return {
            paidUntil: {
                [compare]: date
            }
        };
    }
    return {};
};
const createDeactivationDateFromFilter = (filter) => {
    if (filter === null || filter === void 0 ? void 0 : filter.deactivationDateFrom) {
        const { comparison, date } = filter.deactivationDateFrom;
        const compare = (0, utils_1.mapDateFilterToPrisma)(comparison);
        return {
            deactivation: {
                is: {
                    date: {
                        [compare]: date
                    }
                }
            }
        };
    }
    return {};
};
const createDeactivationDateToFilter = (filter) => {
    if (filter === null || filter === void 0 ? void 0 : filter.deactivationDateTo) {
        const { comparison, date } = filter.deactivationDateTo;
        const compare = (0, utils_1.mapDateFilterToPrisma)(comparison);
        return {
            deactivation: {
                is: {
                    date: {
                        [compare]: date
                    }
                }
            }
        };
    }
    return {};
};
const createDeactivationReasonFilter = (filter) => {
    if (filter === null || filter === void 0 ? void 0 : filter.deactivationReason) {
        return {
            deactivation: {
                reason: filter.deactivationReason
            }
        };
    }
    return {};
};
const createAutoRenewFilter = (filter) => {
    if ((filter === null || filter === void 0 ? void 0 : filter.autoRenew) != null) {
        return {
            autoRenew: filter.autoRenew
        };
    }
    return {};
};
const createPaymentPeriodicityFilter = (filter) => {
    if (filter === null || filter === void 0 ? void 0 : filter.paymentPeriodicity) {
        return {
            paymentPeriodicity: filter.paymentPeriodicity
        };
    }
    return {};
};
const createPaymentMethodFilter = (filter) => {
    if (filter === null || filter === void 0 ? void 0 : filter.paymentMethodID) {
        return {
            paymentMethodID: filter.paymentMethodID
        };
    }
    return {};
};
const createMemberPlanFilter = (filter) => {
    if (filter === null || filter === void 0 ? void 0 : filter.memberPlanID) {
        return {
            memberPlanID: filter.memberPlanID
        };
    }
    return {};
};
const createHasAddressFilter = (filter) => {
    if (filter === null || filter === void 0 ? void 0 : filter.userHasAddress) {
        return {
            user: {
                isNot: {
                    address: null
                }
            }
        };
    }
    return {};
};
const createSubscriptionFilter = (filter) => ({
    AND: [
        createStartsAtFromFilter(filter),
        createStartsAtToFilter(filter),
        createPaidUntilFromFilter(filter),
        createPaidUntilToFilter(filter),
        createDeactivationDateFromFilter(filter),
        createDeactivationDateToFilter(filter),
        createDeactivationReasonFilter(filter),
        createAutoRenewFilter(filter),
        createPaymentPeriodicityFilter(filter),
        createPaymentMethodFilter(filter),
        createMemberPlanFilter(filter),
        createHasAddressFilter(filter)
    ]
});
exports.createSubscriptionFilter = createSubscriptionFilter;
const getSubscriptions = async (filter, sortedField, order, cursorId, skip, take, subscription) => {
    const orderBy = (0, exports.createSubscriptionOrder)(sortedField, (0, sort_1.getSortOrder)(order));
    const where = (0, exports.createSubscriptionFilter)(filter);
    const [totalCount, subscriptions] = await Promise.all([
        subscription.count({
            where,
            orderBy
        }),
        subscription.findMany({
            where,
            skip,
            take: Math.min(take, common_1.MaxResultsPerPage) + 1,
            orderBy,
            cursor: cursorId ? { id: cursorId } : undefined,
            include: {
                deactivation: true,
                periods: true,
                properties: true
            }
        })
    ]);
    const nodes = subscriptions.slice(0, take);
    const firstSubscription = nodes[0];
    const lastSubscription = nodes[nodes.length - 1];
    const hasPreviousPage = Boolean(skip);
    const hasNextPage = subscriptions.length > nodes.length;
    return {
        nodes,
        totalCount,
        pageInfo: {
            hasPreviousPage,
            hasNextPage,
            startCursor: firstSubscription === null || firstSubscription === void 0 ? void 0 : firstSubscription.id,
            endCursor: lastSubscription === null || lastSubscription === void 0 ? void 0 : lastSubscription.id
        }
    };
};
exports.getSubscriptions = getSubscriptions;
//# sourceMappingURL=subscription.queries.js.map