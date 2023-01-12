"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminPeerArticles = void 0;
const graphql_1 = require("graphql");
const graphql_tools_1 = require("graphql-tools");
const article_1 = require("../../db/article");
const common_1 = require("../../db/common");
const utility_1 = require("../../utility");
const permissions_1 = require("../permissions");
const getAdminPeerArticles = async (filter, sort, order, peerNameFilter, stringifiedCursors, context, info) => {
    const { authenticate, loaders, prisma } = context;
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanGetPeerArticles, roles);
    const cursors = stringifiedCursors
        ? JSON.parse(stringifiedCursors)
        : null;
    const peers = (await prisma.peer.findMany({
        orderBy: {
            createdAt: 'desc'
        }
    }))
        .filter(peer => (peerNameFilter ? peer.name === peerNameFilter : true))
        .filter(({ isDisabled }) => !isDisabled);
    for (const peer of peers) {
        // Prime loader cache so we don't need to refetch inside `delegateToPeerSchema`.
        loaders.peer.prime(peer.id, peer);
    }
    const articles = await Promise.all(peers.map(peer => {
        try {
            if (cursors && !cursors[peer.id]) {
                return null;
            }
            return (0, utility_1.delegateToPeerSchema)(peer.id, true, context, {
                info,
                fieldName: 'articles',
                args: {
                    cursor: cursors ? cursors[peer.id] : undefined,
                    take: 50,
                    filter: {
                        published: true
                    },
                    // needed for versions before prisma
                    after: cursors ? (0, utility_1.base64Encode)(cursors[peer.id]) : undefined,
                    first: 50
                },
                transforms: [
                    new graphql_tools_1.ExtractField({
                        from: ['articles', 'nodes', 'article'],
                        to: ['articles', 'nodes']
                    }),
                    new graphql_tools_1.WrapQuery(['articles', 'nodes', 'article'], subtree => ({
                        kind: graphql_1.Kind.SELECTION_SET,
                        selections: [
                            ...subtree.selections,
                            {
                                kind: graphql_1.Kind.FIELD,
                                name: { kind: graphql_1.Kind.NAME, value: 'id' }
                            },
                            {
                                kind: graphql_1.Kind.FIELD,
                                name: { kind: graphql_1.Kind.NAME, value: 'latest' },
                                selectionSet: {
                                    kind: graphql_1.Kind.SELECTION_SET,
                                    selections: [
                                        {
                                            kind: graphql_1.Kind.FIELD,
                                            name: { kind: graphql_1.Kind.NAME, value: 'updatedAt' }
                                        },
                                        {
                                            kind: graphql_1.Kind.FIELD,
                                            name: { kind: graphql_1.Kind.NAME, value: 'publishAt' }
                                        },
                                        {
                                            kind: graphql_1.Kind.FIELD,
                                            name: { kind: graphql_1.Kind.NAME, value: 'publishedAt' }
                                        }
                                    ]
                                }
                            },
                            {
                                kind: graphql_1.Kind.FIELD,
                                name: { kind: graphql_1.Kind.NAME, value: 'modifiedAt' }
                            },
                            {
                                kind: graphql_1.Kind.FIELD,
                                name: { kind: graphql_1.Kind.NAME, value: 'createdAt' }
                            }
                        ]
                    }), result => result),
                    new graphql_tools_1.WrapQuery(['articles'], subtree => ({
                        kind: graphql_1.Kind.SELECTION_SET,
                        selections: [
                            ...subtree.selections,
                            {
                                kind: graphql_1.Kind.FIELD,
                                name: { kind: graphql_1.Kind.NAME, value: 'pageInfo' },
                                selectionSet: {
                                    kind: graphql_1.Kind.SELECTION_SET,
                                    selections: [
                                        {
                                            kind: graphql_1.Kind.FIELD,
                                            name: { kind: graphql_1.Kind.NAME, value: 'endCursor' }
                                        },
                                        {
                                            kind: graphql_1.Kind.FIELD,
                                            name: { kind: graphql_1.Kind.NAME, value: 'hasNextPage' }
                                        }
                                    ]
                                }
                            },
                            {
                                kind: graphql_1.Kind.FIELD,
                                name: { kind: graphql_1.Kind.NAME, value: 'totalCount' }
                            }
                        ]
                    }), result => result)
                ]
            });
        }
        catch (err) {
            return null;
        }
    }));
    const totalCount = articles.reduce((prev, result) => { var _a; return prev + ((_a = result === null || result === void 0 ? void 0 : result.totalCount) !== null && _a !== void 0 ? _a : 0); }, 0);
    const startCursors = Object.fromEntries(articles.map((result, index) => { var _a, _b; return [peers[index].id, (_b = (_a = result === null || result === void 0 ? void 0 : result.pageInfo) === null || _a === void 0 ? void 0 : _a.startCursor) !== null && _b !== void 0 ? _b : null]; }));
    const endCursors = Object.fromEntries(articles.map((result, index) => { var _a, _b; return [peers[index].id, (_b = (_a = result === null || result === void 0 ? void 0 : result.pageInfo) === null || _a === void 0 ? void 0 : _a.endCursor) !== null && _b !== void 0 ? _b : null]; }));
    const hasPreviousPage = articles.reduce((prev, result) => { var _a, _b; return prev || ((_b = (_a = result === null || result === void 0 ? void 0 : result.pageInfo) === null || _a === void 0 ? void 0 : _a.hasPreviousPage) !== null && _b !== void 0 ? _b : false); }, false);
    const hasNextPage = articles.reduce((prev, result) => { var _a, _b; return prev || ((_b = (_a = result === null || result === void 0 ? void 0 : result.pageInfo) === null || _a === void 0 ? void 0 : _a.hasNextPage) !== null && _b !== void 0 ? _b : false); }, false);
    const peerArticles = articles.flatMap((result, index) => {
        var _a;
        const peer = peers[index];
        return (_a = result === null || result === void 0 ? void 0 : result.nodes.map((article) => ({ peerID: peer.id, article }))) !== null && _a !== void 0 ? _a : [];
    });
    let filtered = peerArticles;
    // filters
    if (filter.title) {
        filtered = filtered.filter(({ article }) => { var _a; return article.latest.title.toLowerCase().includes((_a = filter.title) === null || _a === void 0 ? void 0 : _a.toLowerCase()); });
    }
    if (filter.preTitle) {
        filtered = filtered.filter(({ article }) => { var _a; return article.latest.preTitle.toLowerCase().includes((_a = filter.preTitle) === null || _a === void 0 ? void 0 : _a.toLowerCase()); });
    }
    if (filter.lead) {
        filtered = filtered.filter(({ article }) => { var _a; return article.latest.lead.toLowerCase().includes((_a = filter.lead) === null || _a === void 0 ? void 0 : _a.toLowerCase()); });
    }
    if (filter.publicationDateFrom && filter.publicationDateTo) {
        const from = filter.publicationDateFrom.date;
        const to = filter.publicationDateTo.date;
        filtered = filtered.filter(({ article }) => new Date(article.published.publishedAt).getTime() >= new Date(from).getTime() &&
            new Date(article.published.publishedAt).getTime() < new Date(to).getTime());
    }
    switch (sort) {
        case article_1.ArticleSort.CreatedAt:
            filtered.sort((a, b) => new Date(a.article.createdAt).getTime() - new Date(b.article.createdAt).getTime());
            break;
        case article_1.ArticleSort.ModifiedAt:
            filtered.sort((a, b) => new Date(a.article.modifiedAt).getTime() - new Date(b.article.modifiedAt).getTime());
            break;
        case article_1.ArticleSort.PublishAt:
            filtered.sort((a, b) => new Date(a.article.latest.publishAt).getTime() -
                new Date(b.article.latest.publishAt).getTime());
            break;
        case article_1.ArticleSort.PublishedAt:
            filtered.sort((a, b) => new Date(a.article.latest.publishedAt).getTime() -
                new Date(b.article.latest.publishedAt).getTime());
            break;
        case article_1.ArticleSort.UpdatedAt:
            filtered.sort((a, b) => new Date(a.article.latest.updatedAt).getTime() -
                new Date(b.article.latest.updatedAt).getTime());
            break;
    }
    if (order === common_1.SortOrder.Descending) {
        filtered.reverse();
    }
    return {
        nodes: filtered,
        totalCount,
        pageInfo: {
            endCursor: JSON.stringify(endCursors),
            startCursor: JSON.stringify(startCursors),
            hasNextPage,
            hasPreviousPage
        }
    };
};
exports.getAdminPeerArticles = getAdminPeerArticles;
//# sourceMappingURL=peer-article.private-queries.js.map