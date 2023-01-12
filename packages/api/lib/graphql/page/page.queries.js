"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPages = exports.createPageFilter = exports.createPageOrder = void 0;
const common_1 = require("../../db/common");
const page_1 = require("../../db/page");
const sort_1 = require("../queries/sort");
const utils_1 = require("../utils");
const createPageOrder = (field, sortOrder) => {
    switch (field) {
        case page_1.PageSort.CreatedAt:
            return {
                createdAt: sortOrder
            };
        case page_1.PageSort.ModifiedAt:
            return {
                modifiedAt: sortOrder
            };
        case page_1.PageSort.PublishedAt:
            return {
                published: {
                    publishedAt: sortOrder
                }
            };
        case page_1.PageSort.UpdatedAt:
            return {
                published: {
                    updatedAt: sortOrder
                }
            };
        case page_1.PageSort.PublishAt:
            return {
                pending: {
                    publishAt: sortOrder
                }
            };
    }
};
exports.createPageOrder = createPageOrder;
const createTitleFilter = (filter) => {
    if (filter === null || filter === void 0 ? void 0 : filter.title) {
        const containsTitle = {
            title: {
                contains: filter.title,
                mode: 'insensitive'
            }
        };
        return {
            OR: [{ draft: containsTitle }, { pending: containsTitle }, { published: containsTitle }]
        };
    }
    return {};
};
const createDescriptionFilter = (filter) => {
    if (filter === null || filter === void 0 ? void 0 : filter.description) {
        const containsDescription = {
            description: {
                contains: filter.description,
                mode: 'insensitive'
            }
        };
        return {
            OR: [
                { draft: containsDescription },
                { pending: containsDescription },
                { published: containsDescription }
            ]
        };
    }
    return {};
};
const createPublicationDateFromFilter = (filter) => {
    if (filter === null || filter === void 0 ? void 0 : filter.publicationDateFrom) {
        const { comparison, date } = filter.publicationDateFrom;
        const compare = (0, utils_1.mapDateFilterToPrisma)(comparison);
        const filterBy = {
            publishedAt: {
                [compare]: date
            }
        };
        return {
            AND: [{ published: filterBy }]
        };
    }
    return {};
};
const createPublicationDateToFilter = (filter) => {
    if (filter === null || filter === void 0 ? void 0 : filter.publicationDateTo) {
        const { comparison, date } = filter.publicationDateTo;
        const compare = (0, utils_1.mapDateFilterToPrisma)(comparison);
        const filterBy = {
            publishedAt: {
                [compare]: date
            }
        };
        return {
            AND: [{ published: filterBy }]
        };
    }
    return {};
};
const createPublishedFilter = (filter) => {
    if ((filter === null || filter === void 0 ? void 0 : filter.published) != null) {
        return {
            published: filter.published
                ? {
                    isNot: null
                }
                : null
        };
    }
    return {};
};
const createDraftFilter = (filter) => {
    if ((filter === null || filter === void 0 ? void 0 : filter.draft) != null) {
        return {
            draft: filter.draft
                ? {
                    isNot: null
                }
                : null
        };
    }
    return {};
};
const createPendingFilter = (filter) => {
    if ((filter === null || filter === void 0 ? void 0 : filter.pending) != null) {
        return {
            pending: filter.pending
                ? {
                    isNot: null
                }
                : null
        };
    }
    return {};
};
const createTagsFilter = (filter) => {
    if (filter === null || filter === void 0 ? void 0 : filter.tags) {
        const hasTags = {
            is: {
                tags: { hasSome: filter.tags }
            }
        };
        return {
            OR: [{ draft: hasTags }, { pending: hasTags }, { published: hasTags }]
        };
    }
    return {};
};
const createPageFilter = (filter) => ({
    AND: [
        createTitleFilter(filter),
        createPublicationDateFromFilter(filter),
        createPublicationDateToFilter(filter),
        createDescriptionFilter(filter),
        createPublishedFilter(filter),
        createDraftFilter(filter),
        createPendingFilter(filter),
        createTagsFilter(filter)
    ]
});
exports.createPageFilter = createPageFilter;
const getPages = async (filter, sortedField, order, cursorId, skip, take, page) => {
    const orderBy = (0, exports.createPageOrder)(sortedField, (0, sort_1.getSortOrder)(order));
    const where = (0, exports.createPageFilter)(filter);
    const [totalCount, pages] = await Promise.all([
        page.count({
            where,
            orderBy
        }),
        page.findMany({
            where,
            skip,
            take: Math.min(take, common_1.MaxResultsPerPage) + 1,
            orderBy,
            cursor: cursorId ? { id: cursorId } : undefined,
            include: {
                draft: {
                    include: {
                        properties: true
                    }
                },
                pending: {
                    include: {
                        properties: true
                    }
                },
                published: {
                    include: {
                        properties: true
                    }
                }
            }
        })
    ]);
    const nodes = pages.slice(0, take);
    const firstPage = nodes[0];
    const lastPage = nodes[nodes.length - 1];
    const hasPreviousPage = Boolean(skip);
    const hasNextPage = pages.length > nodes.length;
    return {
        nodes,
        totalCount,
        pageInfo: {
            hasPreviousPage,
            hasNextPage,
            startCursor: firstPage === null || firstPage === void 0 ? void 0 : firstPage.id,
            endCursor: lastPage === null || lastPage === void 0 ? void 0 : lastPage.id
        }
    };
};
exports.getPages = getPages;
//# sourceMappingURL=page.queries.js.map