"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getComments = exports.createCommentFilter = exports.createCommentOrder = void 0;
const comment_1 = require("../../db/comment");
const common_1 = require("../../db/common");
const sort_1 = require("../queries/sort");
const createCommentOrder = (field, sortOrder) => {
    switch (field) {
        case comment_1.CommentSort.CreatedAt:
            return {
                createdAt: sortOrder
            };
        case comment_1.CommentSort.ModifiedAt:
            return {
                modifiedAt: sortOrder
            };
    }
};
exports.createCommentOrder = createCommentOrder;
const createTagFilter = (filter) => {
    var _a;
    if ((_a = filter === null || filter === void 0 ? void 0 : filter.tags) === null || _a === void 0 ? void 0 : _a.length) {
        return {
            tags: {
                some: {
                    tagId: {
                        in: filter === null || filter === void 0 ? void 0 : filter.tags
                    }
                }
            }
        };
    }
    return {};
};
const createStateFilter = (filter) => {
    if (filter === null || filter === void 0 ? void 0 : filter.states) {
        return {
            state: {
                in: filter.states
            }
        };
    }
    return {};
};
const createItemFilter = (filter) => {
    if (filter === null || filter === void 0 ? void 0 : filter.item) {
        return {
            itemID: filter.item
        };
    }
    return {};
};
const createItemTypeFilter = (filter) => {
    if (filter === null || filter === void 0 ? void 0 : filter.itemType) {
        return {
            itemType: {
                equals: filter.itemType
            }
        };
    }
    return {};
};
const createItemIdFilter = (filter) => {
    if (filter.itemID) {
        return {
            itemID: {
                equals: filter.itemID
            }
        };
    }
    return {};
};
const createCommentFilter = (filter) => ({
    AND: [
        createStateFilter(filter),
        createTagFilter(filter),
        createItemTypeFilter(filter),
        createItemIdFilter(filter),
        createItemFilter(filter)
    ]
});
exports.createCommentFilter = createCommentFilter;
const getComments = async (filter, sortedField, order, cursorId, skip, take, comment) => {
    const orderBy = (0, exports.createCommentOrder)(sortedField, (0, sort_1.getSortOrder)(order));
    const where = (0, exports.createCommentFilter)(filter);
    const [totalCount, comments] = await Promise.all([
        comment.count({
            where,
            orderBy
        }),
        comment.findMany({
            where,
            skip,
            take: Math.min(take, common_1.MaxResultsPerPage) + 1,
            orderBy,
            cursor: cursorId ? { id: cursorId } : undefined,
            include: {
                revisions: { orderBy: { createdAt: 'asc' } }
            }
        })
    ]);
    const nodes = comments.slice(0, take);
    const firstComment = nodes[0];
    const lastComment = nodes[nodes.length - 1];
    const hasPreviousPage = Boolean(skip);
    const hasNextPage = comments.length > nodes.length;
    return {
        nodes,
        totalCount,
        pageInfo: {
            hasPreviousPage,
            hasNextPage,
            startCursor: firstComment === null || firstComment === void 0 ? void 0 : firstComment.id,
            endCursor: lastComment === null || lastComment === void 0 ? void 0 : lastComment.id
        }
    };
};
exports.getComments = getComments;
//# sourceMappingURL=comment.queries.js.map