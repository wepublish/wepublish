"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTags = exports.createTagFilter = exports.createTagOrder = exports.TagSort = void 0;
const common_1 = require("../../db/common");
const permissions_1 = require("../permissions");
const sort_1 = require("../queries/sort");
var TagSort;
(function (TagSort) {
    TagSort["CreatedAt"] = "CreatedAt";
    TagSort["ModifiedAt"] = "ModifiedAt";
    TagSort["Tag"] = "Tag";
})(TagSort = exports.TagSort || (exports.TagSort = {}));
const createTagOrder = (field, sortOrder) => {
    switch (field) {
        case TagSort.Tag:
            return {
                tag: sortOrder
            };
        case TagSort.ModifiedAt:
            return {
                modifiedAt: sortOrder
            };
        case TagSort.CreatedAt:
        default:
            return {
                createdAt: sortOrder
            };
    }
};
exports.createTagOrder = createTagOrder;
const createTypeFilter = (filter) => {
    if (filter === null || filter === void 0 ? void 0 : filter.type) {
        return {
            type: filter === null || filter === void 0 ? void 0 : filter.type
        };
    }
    return {};
};
const createTagNameFilter = (filter) => {
    if (filter === null || filter === void 0 ? void 0 : filter.tag) {
        return {
            tag: {
                mode: 'insensitive',
                contains: filter.tag
            }
        };
    }
    return {};
};
const createTagFilter = (filter) => ({
    AND: [createTypeFilter(filter), createTagNameFilter(filter)]
});
exports.createTagFilter = createTagFilter;
const getTags = async (filter, sortedField, order, cursorId, skip, take, authenticate, tag) => {
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanGetTags, roles);
    const orderBy = (0, exports.createTagOrder)(sortedField, (0, sort_1.getSortOrder)(order));
    const where = (0, exports.createTagFilter)(filter);
    const [totalCount, tags] = await Promise.all([
        tag.count({
            where,
            orderBy
        }),
        tag.findMany({
            where,
            skip,
            take: Math.min(take, common_1.MaxResultsPerPage) + 1,
            orderBy,
            cursor: cursorId ? { id: cursorId } : undefined
        })
    ]);
    const nodes = tags.slice(0, take);
    const firstTag = nodes[0];
    const lastTag = nodes[nodes.length - 1];
    const hasPreviousPage = Boolean(skip);
    const hasNextPage = tags.length > nodes.length;
    return {
        nodes,
        totalCount,
        pageInfo: {
            hasPreviousPage,
            hasNextPage,
            startCursor: firstTag === null || firstTag === void 0 ? void 0 : firstTag.id,
            endCursor: lastTag === null || lastTag === void 0 ? void 0 : lastTag.id
        }
    };
};
exports.getTags = getTags;
//# sourceMappingURL=tag.private-query.js.map