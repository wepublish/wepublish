"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getArticles = exports.createArticleFilter = exports.createArticleOrder = void 0;
const article_1 = require("../../db/article");
const common_1 = require("../../db/common");
const sort_1 = require("../queries/sort");
const utils_1 = require("../utils");
const createArticleOrder = (field, sortOrder) => {
    switch (field) {
        case article_1.ArticleSort.CreatedAt:
            return {
                createdAt: sortOrder
            };
        case article_1.ArticleSort.ModifiedAt:
            return {
                modifiedAt: sortOrder
            };
        case article_1.ArticleSort.PublishedAt:
            return {
                published: {
                    publishedAt: sortOrder
                }
            };
        case article_1.ArticleSort.UpdatedAt:
            return {
                published: {
                    updatedAt: sortOrder
                }
            };
        case article_1.ArticleSort.PublishAt:
            return {
                pending: {
                    publishAt: sortOrder
                }
            };
    }
};
exports.createArticleOrder = createArticleOrder;
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
const createPreTitleFilter = (filter) => {
    if (filter === null || filter === void 0 ? void 0 : filter.preTitle) {
        const containsPreTitle = {
            preTitle: {
                contains: filter.preTitle,
                mode: 'insensitive'
            }
        };
        return {
            OR: [{ draft: containsPreTitle }, { pending: containsPreTitle }, { published: containsPreTitle }]
        };
    }
    return {};
};
const createLeadFilter = (filter) => {
    if (filter === null || filter === void 0 ? void 0 : filter.lead) {
        const containsLead = {
            lead: {
                contains: filter.lead,
                mode: 'insensitive'
            }
        };
        return {
            OR: [{ draft: containsLead }, { pending: containsLead }, { published: containsLead }]
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
            publishedId: filter.published
                ? {
                    not: null
                }
                : null
        };
    }
    return {};
};
const createDraftFilter = (filter) => {
    if ((filter === null || filter === void 0 ? void 0 : filter.draft) != null) {
        return {
            draftId: filter.draft
                ? {
                    not: null
                }
                : null
        };
    }
    return {};
};
const createPendingFilter = (filter) => {
    if ((filter === null || filter === void 0 ? void 0 : filter.pending) != null) {
        return {
            pendingId: filter.pending
                ? {
                    not: null
                }
                : null
        };
    }
    return {};
};
const createSharedFilter = (filter) => {
    if ((filter === null || filter === void 0 ? void 0 : filter.shared) != null) {
        return {
            shared: filter.shared
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
const createAuthorFilter = (filter) => {
    if (filter === null || filter === void 0 ? void 0 : filter.authors) {
        const hasAuthors = {
            is: {
                authors: {
                    some: {
                        authorId: {
                            in: filter.authors
                        }
                    }
                }
            }
        };
        return {
            OR: [{ draft: hasAuthors }, { pending: hasAuthors }, { published: hasAuthors }]
        };
    }
    return {};
};
const createArticleFilter = (filter) => ({
    AND: [
        createTitleFilter(filter),
        createPreTitleFilter(filter),
        createPublicationDateFromFilter(filter),
        createPublicationDateToFilter(filter),
        createLeadFilter(filter),
        createPublishedFilter(filter),
        createDraftFilter(filter),
        createPendingFilter(filter),
        createSharedFilter(filter),
        createTagsFilter(filter),
        createAuthorFilter(filter)
    ]
});
exports.createArticleFilter = createArticleFilter;
const getArticles = async (filter, sortedField, order, cursorId, skip, take, article) => {
    const orderBy = (0, exports.createArticleOrder)(sortedField, (0, sort_1.getSortOrder)(order));
    const where = (0, exports.createArticleFilter)(filter);
    const [totalCount, articles] = await Promise.all([
        article.count({
            where,
            orderBy
        }),
        article.findMany({
            where,
            skip,
            take: Math.min(take, common_1.MaxResultsPerPage) + 1,
            orderBy,
            cursor: cursorId ? { id: cursorId } : undefined,
            include: {
                draft: {
                    include: {
                        properties: true,
                        authors: true,
                        socialMediaAuthors: true
                    }
                },
                pending: {
                    include: {
                        properties: true,
                        authors: true,
                        socialMediaAuthors: true
                    }
                },
                published: {
                    include: {
                        properties: true,
                        authors: true,
                        socialMediaAuthors: true
                    }
                }
            }
        })
    ]);
    const nodes = articles.slice(0, take);
    const firstArticle = nodes[0];
    const lastArticle = nodes[nodes.length - 1];
    const hasPreviousPage = Boolean(skip);
    const hasNextPage = articles.length > nodes.length;
    return {
        nodes,
        totalCount,
        pageInfo: {
            hasPreviousPage,
            hasNextPage,
            startCursor: firstArticle === null || firstArticle === void 0 ? void 0 : firstArticle.id,
            endCursor: lastArticle === null || lastArticle === void 0 ? void 0 : lastArticle.id
        }
    };
};
exports.getArticles = getArticles;
//# sourceMappingURL=article.queries.js.map