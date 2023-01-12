"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphQLPublicArticleConnection = exports.GraphQLPublicArticle = exports.GraphQLPeerArticleConnection = exports.GraphQLPeerArticle = exports.GraphQLArticleConnection = exports.GraphQLArticle = exports.GraphQLArticleRevision = exports.GraphQLArticleInput = exports.GraphQLPublicArticleSort = exports.GraphQLArticleSort = exports.GraphQLPublicArticleFilter = exports.GraphQLArticleFilter = void 0;
const graphql_1 = require("graphql");
const graphql_iso_date_1 = require("graphql-iso-date");
const image_1 = require("./image");
const author_1 = require("./author");
const article_1 = require("../db/article");
const slug_1 = require("./slug");
const common_1 = require("./common");
const blocks_1 = require("./blocks");
const utility_1 = require("../utility");
const peer_1 = require("./peer");
const comment_1 = require("./comment/comment");
const session_1 = require("../db/session");
const comment_public_queries_1 = require("./comment/comment.public-queries");
exports.GraphQLArticleFilter = new graphql_1.GraphQLInputObjectType({
    name: 'ArticleFilter',
    fields: {
        title: { type: graphql_1.GraphQLString },
        preTitle: { type: graphql_1.GraphQLString },
        lead: { type: graphql_1.GraphQLString },
        publicationDateFrom: { type: common_1.GraphQLDateFilter },
        publicationDateTo: { type: common_1.GraphQLDateFilter },
        draft: { type: graphql_1.GraphQLBoolean },
        published: { type: graphql_1.GraphQLBoolean },
        pending: { type: graphql_1.GraphQLBoolean },
        authors: { type: (0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID)) },
        tags: { type: (0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString)) }
    }
});
exports.GraphQLPublicArticleFilter = new graphql_1.GraphQLInputObjectType({
    name: 'ArticleFilter',
    fields: {
        authors: { type: (0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID)) },
        tags: { type: (0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString)) }
    }
});
exports.GraphQLArticleSort = new graphql_1.GraphQLEnumType({
    name: 'ArticleSort',
    values: {
        CREATED_AT: { value: article_1.ArticleSort.CreatedAt },
        MODIFIED_AT: { value: article_1.ArticleSort.ModifiedAt },
        PUBLISH_AT: { value: article_1.ArticleSort.PublishAt },
        PUBLISHED_AT: { value: article_1.ArticleSort.PublishedAt },
        UPDATED_AT: { value: article_1.ArticleSort.UpdatedAt }
    }
});
exports.GraphQLPublicArticleSort = new graphql_1.GraphQLEnumType({
    name: 'ArticleSort',
    values: {
        PUBLISHED_AT: { value: article_1.ArticleSort.PublishedAt },
        UPDATED_AT: { value: article_1.ArticleSort.UpdatedAt }
    }
});
exports.GraphQLArticleInput = new graphql_1.GraphQLInputObjectType({
    name: 'ArticleInput',
    fields: {
        slug: { type: slug_1.GraphQLSlug },
        preTitle: { type: graphql_1.GraphQLString },
        title: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        lead: { type: graphql_1.GraphQLString },
        seoTitle: { type: graphql_1.GraphQLString },
        tags: { type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString))) },
        properties: { type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(common_1.GraphQLMetadataPropertyInput))) },
        canonicalUrl: { type: graphql_1.GraphQLString },
        imageID: { type: graphql_1.GraphQLID },
        authorIDs: { type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID))) },
        shared: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLBoolean) },
        breaking: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLBoolean) },
        hideAuthor: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLBoolean) },
        socialMediaTitle: { type: graphql_1.GraphQLString },
        socialMediaDescription: { type: graphql_1.GraphQLString },
        socialMediaAuthorIDs: { type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID))) },
        socialMediaImageID: { type: graphql_1.GraphQLID },
        blocks: {
            type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(blocks_1.GraphQLBlockInput)))
        }
    }
});
exports.GraphQLArticleRevision = new graphql_1.GraphQLObjectType({
    name: 'ArticleRevision',
    fields: {
        revision: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLInt) },
        createdAt: { type: (0, graphql_1.GraphQLNonNull)(graphql_iso_date_1.GraphQLDateTime) },
        publishAt: { type: graphql_iso_date_1.GraphQLDateTime },
        updatedAt: { type: graphql_iso_date_1.GraphQLDateTime },
        publishedAt: { type: graphql_iso_date_1.GraphQLDateTime },
        hideAuthor: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLBoolean) },
        preTitle: { type: graphql_1.GraphQLString },
        title: { type: graphql_1.GraphQLString },
        lead: { type: graphql_1.GraphQLString },
        seoTitle: { type: graphql_1.GraphQLString },
        slug: { type: graphql_1.GraphQLString },
        tags: { type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString))) },
        properties: { type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(common_1.GraphQLMetadataProperty))) },
        canonicalUrl: { type: graphql_1.GraphQLString },
        url: {
            type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString),
            resolve: (0, utility_1.createProxyingResolver)((articleRevision, args, { urlAdapter }, info) => {
                var _a;
                // The URLAdapter expects a public article to generate the public article URL.
                // The URL should never be created with values from the updatedAt, publishAt
                // and publishedAt dates, but they are required by the method.
                return urlAdapter.getPublicArticleURL(Object.assign(Object.assign({}, articleRevision), { id: ((_a = info === null || info === void 0 ? void 0 : info.variableValues) === null || _a === void 0 ? void 0 : _a.id) || 'ID-DOES-NOT-EXIST', shared: true, updatedAt: new Date(), publishAt: new Date(), publishedAt: new Date() }));
            })
        },
        image: {
            type: image_1.GraphQLImage,
            resolve: (0, utility_1.createProxyingResolver)(({ imageID }, args, { loaders }, info) => {
                return imageID ? loaders.images.load(imageID) : null;
            })
        },
        authors: {
            type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(author_1.GraphQLAuthor))),
            resolve: (0, utility_1.createProxyingResolver)(({ authors }, args, { loaders }) => {
                return loaders.authorsByID.loadMany(authors.map(({ authorId }) => authorId));
            })
        },
        breaking: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLBoolean) },
        socialMediaTitle: { type: graphql_1.GraphQLString },
        socialMediaDescription: { type: graphql_1.GraphQLString },
        socialMediaAuthors: {
            type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(author_1.GraphQLAuthor))),
            resolve: (0, utility_1.createProxyingResolver)(({ socialMediaAuthors }, args, { loaders }) => {
                return loaders.authorsByID.loadMany(socialMediaAuthors.map(({ authorId }) => authorId));
            })
        },
        socialMediaImage: {
            type: image_1.GraphQLImage,
            resolve: (0, utility_1.createProxyingResolver)(({ socialMediaImageID }, args, { loaders }, info) => {
                return socialMediaImageID ? loaders.images.load(socialMediaImageID) : null;
            })
        },
        blocks: { type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(blocks_1.GraphQLBlock))) }
    }
});
exports.GraphQLArticle = new graphql_1.GraphQLObjectType({
    name: 'Article',
    fields: {
        id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
        shared: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLBoolean) },
        createdAt: { type: (0, graphql_1.GraphQLNonNull)(graphql_iso_date_1.GraphQLDateTime) },
        modifiedAt: { type: (0, graphql_1.GraphQLNonNull)(graphql_iso_date_1.GraphQLDateTime) },
        draft: { type: exports.GraphQLArticleRevision },
        published: { type: exports.GraphQLArticleRevision },
        pending: { type: exports.GraphQLArticleRevision },
        latest: {
            type: (0, graphql_1.GraphQLNonNull)(exports.GraphQLArticleRevision),
            resolve: (0, utility_1.createProxyingResolver)(({ draft, pending, published }, {}, {}, info) => {
                var _a;
                return (_a = draft !== null && draft !== void 0 ? draft : pending) !== null && _a !== void 0 ? _a : published;
            })
        }
        // TODO: Implement article history
        // history: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLArticleRevision)))}
    }
});
exports.GraphQLArticleConnection = new graphql_1.GraphQLObjectType({
    name: 'ArticleConnection',
    fields: {
        nodes: { type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(exports.GraphQLArticle))) },
        pageInfo: { type: (0, graphql_1.GraphQLNonNull)(common_1.GraphQLPageInfo) },
        totalCount: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLInt) }
    }
});
exports.GraphQLPeerArticle = new graphql_1.GraphQLObjectType({
    name: 'PeerArticle',
    fields: {
        peer: {
            type: (0, graphql_1.GraphQLNonNull)(peer_1.GraphQLPeer),
            resolve: (0, utility_1.createProxyingResolver)(({ peerID }, {}, { loaders }) => loaders.peer.load(peerID))
        },
        peeredArticleURL: {
            type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString),
            resolve: (0, utility_1.createProxyingResolver)(async ({ peerID, article }, {}, { loaders, urlAdapter }) => {
                const peer = await loaders.peer.load(peerID);
                if (!peer || !article)
                    return '';
                return urlAdapter.getPeeredArticleURL(peer, article);
            })
        },
        article: { type: (0, graphql_1.GraphQLNonNull)(exports.GraphQLArticle) }
    }
});
exports.GraphQLPeerArticleConnection = new graphql_1.GraphQLObjectType({
    name: 'PeerArticleConnection',
    fields: {
        nodes: { type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(exports.GraphQLPeerArticle))) },
        pageInfo: { type: (0, graphql_1.GraphQLNonNull)(common_1.GraphQLUnidirectionalPageInfo) },
        totalCount: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLInt) }
    }
});
exports.GraphQLPublicArticle = new graphql_1.GraphQLObjectType({
    name: 'Article',
    fields: {
        id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
        updatedAt: { type: (0, graphql_1.GraphQLNonNull)(graphql_iso_date_1.GraphQLDateTime) },
        publishedAt: { type: (0, graphql_1.GraphQLNonNull)(graphql_iso_date_1.GraphQLDateTime) },
        slug: { type: (0, graphql_1.GraphQLNonNull)(slug_1.GraphQLSlug) },
        url: {
            type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString),
            resolve: (0, utility_1.createProxyingResolver)((article, {}, { urlAdapter }) => {
                return urlAdapter.getPublicArticleURL(article);
            })
        },
        preTitle: { type: graphql_1.GraphQLString },
        title: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        lead: { type: graphql_1.GraphQLString },
        seoTitle: { type: graphql_1.GraphQLString },
        tags: { type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString))) },
        canonicalUrl: { type: graphql_1.GraphQLString },
        properties: {
            type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(common_1.GraphQLMetadataPropertyPublic))),
            resolve: ({ properties }) => {
                return properties.filter(property => property.public).map(({ key, value }) => ({ key, value }));
            }
        },
        image: {
            type: image_1.GraphQLImage,
            resolve: (0, utility_1.createProxyingResolver)(({ imageID }, args, { loaders }, info) => {
                return imageID ? loaders.images.load(imageID) : null;
            })
        },
        authors: {
            type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)(author_1.GraphQLAuthor)),
            resolve: (0, utility_1.createProxyingResolver)(({ authors, hideAuthor }, args, { loaders }) => {
                if (hideAuthor) {
                    return [];
                }
                return authors.map(({ authorId }) => loaders.authorsByID.load(authorId));
            })
        },
        breaking: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLBoolean) },
        socialMediaTitle: { type: graphql_1.GraphQLString },
        socialMediaDescription: { type: graphql_1.GraphQLString },
        socialMediaAuthors: {
            type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(author_1.GraphQLAuthor))),
            resolve: (0, utility_1.createProxyingResolver)(({ socialMediaAuthors, hideAuthor }, args, { loaders }) => {
                if (hideAuthor) {
                    return [];
                }
                return loaders.authorsByID.loadMany(socialMediaAuthors.map(({ authorId }) => authorId));
            })
        },
        socialMediaImage: {
            type: image_1.GraphQLImage,
            resolve: (0, utility_1.createProxyingResolver)(({ socialMediaImageID }, args, { loaders }, info) => {
                return socialMediaImageID ? loaders.images.load(socialMediaImageID) : null;
            })
        },
        blocks: { type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(blocks_1.GraphQLPublicBlock))) },
        comments: {
            type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(comment_1.GraphQLPublicComment))),
            resolve: (0, utility_1.createProxyingResolver)(async ({ id }, _, { session, authenticateUser, prisma: { comment, commentRatingSystemAnswer } }) => {
                var _a, _b;
                // if session exists, should get user's un-approved comments as well
                // if not we should get approved ones
                const userSession = (session === null || session === void 0 ? void 0 : session.type) === session_1.SessionType.User ? authenticateUser() : null;
                return (0, comment_public_queries_1.getPublicCommentsForItemById)(id, (_b = (_a = userSession === null || userSession === void 0 ? void 0 : userSession.user) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : null, null, -1, commentRatingSystemAnswer, comment);
            })
        }
    }
});
exports.GraphQLPublicArticleConnection = new graphql_1.GraphQLObjectType({
    name: 'ArticleConnection',
    fields: {
        nodes: { type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(exports.GraphQLPublicArticle))) },
        pageInfo: { type: (0, graphql_1.GraphQLNonNull)(common_1.GraphQLPageInfo) },
        totalCount: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLInt) }
    }
});
//# sourceMappingURL=article.js.map