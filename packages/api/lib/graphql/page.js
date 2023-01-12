"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphQLPublicPageConnection = exports.GraphQLPublicPage = exports.GraphQLPageConnection = exports.GraphQLPage = exports.GraphQLPageRevision = exports.GraphQLPageInput = exports.GraphQLPublishedPageSort = exports.GraphQLPageSort = exports.GraphQLPublishedPageFilter = exports.GraphQLPageFilter = void 0;
const graphql_1 = require("graphql");
const graphql_iso_date_1 = require("graphql-iso-date");
const image_1 = require("./image");
const page_1 = require("../db/page");
const slug_1 = require("./slug");
const common_1 = require("./common");
const blocks_1 = require("./blocks");
const utility_1 = require("../utility");
exports.GraphQLPageFilter = new graphql_1.GraphQLInputObjectType({
    name: 'PageFilter',
    fields: {
        title: { type: graphql_1.GraphQLString },
        draft: { type: graphql_1.GraphQLBoolean },
        description: { type: graphql_1.GraphQLString },
        publicationDateFrom: { type: common_1.GraphQLDateFilter },
        publicationDateTo: { type: common_1.GraphQLDateFilter },
        published: { type: graphql_1.GraphQLBoolean },
        pending: { type: graphql_1.GraphQLBoolean },
        tags: { type: (0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString)) }
    }
});
exports.GraphQLPublishedPageFilter = new graphql_1.GraphQLInputObjectType({
    name: 'PublishedPageFilter',
    fields: {
        tags: { type: (0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString)) }
    }
});
exports.GraphQLPageSort = new graphql_1.GraphQLEnumType({
    name: 'PageSort',
    values: {
        CREATED_AT: { value: page_1.PageSort.CreatedAt },
        MODIFIED_AT: { value: page_1.PageSort.ModifiedAt },
        PUBLISH_AT: { value: page_1.PageSort.PublishAt },
        PUBLISHED_AT: { value: page_1.PageSort.PublishedAt },
        UPDATED_AT: { value: page_1.PageSort.UpdatedAt }
    }
});
exports.GraphQLPublishedPageSort = new graphql_1.GraphQLEnumType({
    name: 'PublishedPageSort',
    values: {
        PUBLISHED_AT: { value: page_1.PageSort.PublishedAt },
        UPDATED_AT: { value: page_1.PageSort.UpdatedAt }
    }
});
exports.GraphQLPageInput = new graphql_1.GraphQLInputObjectType({
    name: 'PageInput',
    fields: () => ({
        slug: { type: (0, graphql_1.GraphQLNonNull)(slug_1.GraphQLSlug) },
        title: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        description: { type: graphql_1.GraphQLString },
        tags: { type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString))) },
        properties: { type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(common_1.GraphQLMetadataPropertyInput))) },
        imageID: { type: graphql_1.GraphQLID },
        socialMediaTitle: { type: graphql_1.GraphQLString },
        socialMediaDescription: { type: graphql_1.GraphQLString },
        socialMediaImageID: { type: graphql_1.GraphQLID },
        blocks: {
            type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(blocks_1.GraphQLBlockInput)))
        }
    })
});
exports.GraphQLPageRevision = new graphql_1.GraphQLObjectType({
    name: 'PageRevision',
    fields: () => ({
        revision: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLInt) },
        createdAt: { type: (0, graphql_1.GraphQLNonNull)(graphql_iso_date_1.GraphQLDateTime) },
        publishAt: { type: graphql_iso_date_1.GraphQLDateTime },
        updatedAt: { type: graphql_iso_date_1.GraphQLDateTime },
        publishedAt: { type: graphql_iso_date_1.GraphQLDateTime },
        slug: { type: (0, graphql_1.GraphQLNonNull)(slug_1.GraphQLSlug) },
        title: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        description: { type: graphql_1.GraphQLString },
        tags: { type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString))) },
        properties: { type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(common_1.GraphQLMetadataProperty))) },
        url: {
            type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString),
            resolve: (0, utility_1.createProxyingResolver)((pageRevision, args, { urlAdapter }, info) => {
                var _a;
                // The URLAdapter expects a public page to generate the public page URL.
                // The URL should never be created with values from the updatedAt and
                // publishedAt dates, but they are required by the method.
                return urlAdapter.getPublicPageURL(Object.assign(Object.assign({}, pageRevision), { id: ((_a = info === null || info === void 0 ? void 0 : info.variableValues) === null || _a === void 0 ? void 0 : _a.id) || 'ID-DOES-NOT-EXIST', updatedAt: new Date(), publishedAt: new Date() }));
            })
        },
        image: {
            type: image_1.GraphQLImage,
            resolve: (0, utility_1.createProxyingResolver)(({ imageID }, args, { loaders }, info) => {
                return imageID ? loaders.images.load(imageID) : null;
            })
        },
        socialMediaTitle: { type: graphql_1.GraphQLString },
        socialMediaDescription: { type: graphql_1.GraphQLString },
        socialMediaImage: {
            type: image_1.GraphQLImage,
            resolve: (0, utility_1.createProxyingResolver)(({ socialMediaImageID }, args, { loaders }, info) => {
                return socialMediaImageID ? loaders.images.load(socialMediaImageID) : null;
            })
        },
        blocks: { type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(blocks_1.GraphQLBlock))) }
    })
});
exports.GraphQLPage = new graphql_1.GraphQLObjectType({
    name: 'Page',
    fields: {
        id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
        shared: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLBoolean) },
        createdAt: { type: (0, graphql_1.GraphQLNonNull)(graphql_iso_date_1.GraphQLDateTime) },
        modifiedAt: { type: (0, graphql_1.GraphQLNonNull)(graphql_iso_date_1.GraphQLDateTime) },
        draft: {
            type: exports.GraphQLPageRevision
        },
        published: {
            type: exports.GraphQLPageRevision
        },
        pending: {
            type: exports.GraphQLPageRevision
        },
        latest: {
            type: (0, graphql_1.GraphQLNonNull)(exports.GraphQLPageRevision),
            resolve: (0, utility_1.createProxyingResolver)(({ draft, pending, published }) => {
                var _a;
                return (_a = draft !== null && draft !== void 0 ? draft : pending) !== null && _a !== void 0 ? _a : published;
            })
        }
    }
    // TODO: Implement page history
    // history: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLPageRevision)))}
});
exports.GraphQLPageConnection = new graphql_1.GraphQLObjectType({
    name: 'PageConnection',
    fields: {
        nodes: { type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(exports.GraphQLPage))) },
        pageInfo: { type: (0, graphql_1.GraphQLNonNull)(common_1.GraphQLPageInfo) },
        totalCount: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLInt) }
    }
});
exports.GraphQLPublicPage = new graphql_1.GraphQLObjectType({
    name: 'Page',
    fields: () => ({
        id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
        updatedAt: { type: (0, graphql_1.GraphQLNonNull)(graphql_iso_date_1.GraphQLDateTime) },
        publishedAt: { type: (0, graphql_1.GraphQLNonNull)(graphql_iso_date_1.GraphQLDateTime) },
        slug: { type: (0, graphql_1.GraphQLNonNull)(slug_1.GraphQLSlug) },
        url: {
            type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString),
            resolve: (0, utility_1.createProxyingResolver)((page, {}, { urlAdapter }) => {
                return urlAdapter.getPublicPageURL(page);
            })
        },
        title: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        description: { type: graphql_1.GraphQLString },
        tags: { type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString))) },
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
        socialMediaTitle: { type: graphql_1.GraphQLString },
        socialMediaDescription: { type: graphql_1.GraphQLString },
        socialMediaImage: {
            type: image_1.GraphQLImage,
            resolve: (0, utility_1.createProxyingResolver)(({ socialMediaImageID }, args, { loaders }, info) => {
                return socialMediaImageID ? loaders.images.load(socialMediaImageID) : null;
            })
        },
        blocks: { type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(blocks_1.GraphQLPublicBlock))) }
    })
});
exports.GraphQLPublicPageConnection = new graphql_1.GraphQLObjectType({
    name: 'PageConnection',
    fields: {
        nodes: { type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(exports.GraphQLPublicPage))) },
        pageInfo: { type: (0, graphql_1.GraphQLNonNull)(common_1.GraphQLPageInfo) },
        totalCount: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLInt) }
    }
});
//# sourceMappingURL=page.js.map