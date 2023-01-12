"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuthors = exports.createAuthorFilter = exports.createAuthorOrder = void 0;
const author_1 = require("../../db/author");
const common_1 = require("../../db/common");
const sort_1 = require("../queries/sort");
const createAuthorOrder = (field, sortOrder) => {
    switch (field) {
        case author_1.AuthorSort.CreatedAt:
            return {
                createdAt: sortOrder
            };
        case author_1.AuthorSort.ModifiedAt:
            return {
                modifiedAt: sortOrder
            };
        case author_1.AuthorSort.Name:
            return {
                name: sortOrder
            };
    }
};
exports.createAuthorOrder = createAuthorOrder;
const createNameFilter = (filter) => {
    if (filter === null || filter === void 0 ? void 0 : filter.name) {
        return {
            name: filter.name
        };
    }
    return {};
};
const createAuthorFilter = (filter) => ({
    AND: [createNameFilter(filter)]
});
exports.createAuthorFilter = createAuthorFilter;
const getAuthors = async (filter, sortedField, order, cursorId, skip, take, author) => {
    const orderBy = (0, exports.createAuthorOrder)(sortedField, (0, sort_1.getSortOrder)(order));
    const where = (0, exports.createAuthorFilter)(filter);
    const [totalCount, authors] = await Promise.all([
        author.count({
            where,
            orderBy
        }),
        author.findMany({
            where,
            skip,
            take: Math.min(take, common_1.MaxResultsPerPage) + 1,
            orderBy,
            cursor: cursorId ? { id: cursorId } : undefined,
            include: {
                links: true
            }
        })
    ]);
    const nodes = authors.slice(0, take);
    const firstAuthor = nodes[0];
    const lastAuthor = nodes[nodes.length - 1];
    const hasPreviousPage = Boolean(skip);
    const hasNextPage = authors.length > nodes.length;
    return {
        nodes,
        totalCount,
        pageInfo: {
            hasPreviousPage,
            hasNextPage,
            startCursor: firstAuthor === null || firstAuthor === void 0 ? void 0 : firstAuthor.id,
            endCursor: lastAuthor === null || lastAuthor === void 0 ? void 0 : lastAuthor.id
        }
    };
};
exports.getAuthors = getAuthors;
//# sourceMappingURL=author.queries.js.map