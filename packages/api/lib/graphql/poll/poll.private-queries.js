"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPolls = exports.createPollFilter = exports.createPollOrder = exports.PollSort = void 0;
const common_1 = require("../../db/common");
const sort_1 = require("../queries/sort");
const permissions_1 = require("../permissions");
var PollSort;
(function (PollSort) {
    PollSort["CreatedAt"] = "CreatedAt";
    PollSort["ModifiedAt"] = "ModifiedAt";
    PollSort["OpensAt"] = "OpensAt";
})(PollSort = exports.PollSort || (exports.PollSort = {}));
const createPollOrder = (field, sortOrder) => {
    switch (field) {
        case PollSort.ModifiedAt:
            return {
                modifiedAt: sortOrder
            };
        case PollSort.CreatedAt:
            return {
                createdAt: sortOrder
            };
        case PollSort.OpensAt:
        default:
            return {
                opensAt: sortOrder
            };
    }
};
exports.createPollOrder = createPollOrder;
const createOpenOnlyFilter = (filter) => {
    if (filter === null || filter === void 0 ? void 0 : filter.openOnly) {
        return {
            opensAt: {
                lte: new Date()
            },
            OR: [
                {
                    closedAt: null
                },
                {
                    closedAt: {
                        gte: new Date()
                    }
                }
            ]
        };
    }
    return {};
};
const createPollFilter = (filter) => ({
    AND: [createOpenOnlyFilter(filter)]
});
exports.createPollFilter = createPollFilter;
const getPolls = async (filter, sortedField, order, cursorId, skip, take, authenticate, poll) => {
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanGetPoll, roles);
    const orderBy = (0, exports.createPollOrder)(sortedField, (0, sort_1.getSortOrder)(order));
    const where = (0, exports.createPollFilter)(filter);
    const [totalCount, polls] = await Promise.all([
        poll.count({
            where: where,
            orderBy: orderBy
        }),
        poll.findMany({
            where: where,
            skip: skip,
            take: Math.min(take, common_1.MaxResultsPerPage) + 1,
            orderBy: orderBy,
            cursor: cursorId ? { id: cursorId } : undefined,
            include: {
                answers: true
            }
        })
    ]);
    const nodes = polls.slice(0, take);
    const firstPoll = nodes[0];
    const lastPoll = nodes[nodes.length - 1];
    const hasPreviousPage = Boolean(skip);
    const hasNextPage = polls.length > nodes.length;
    return {
        nodes,
        totalCount,
        pageInfo: {
            hasPreviousPage,
            hasNextPage,
            startCursor: firstPoll === null || firstPoll === void 0 ? void 0 : firstPoll.id,
            endCursor: lastPoll === null || lastPoll === void 0 ? void 0 : lastPoll.id
        }
    };
};
exports.getPolls = getPolls;
//# sourceMappingURL=poll.private-queries.js.map