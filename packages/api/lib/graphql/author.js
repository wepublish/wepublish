"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphQLAuthorInput = exports.GraphQLAuthorLinkInput = exports.GraphQLAuthorConnection = exports.GraphQLAuthorSort = exports.GraphQLAuthorFilter = exports.GraphQLAuthor = exports.GraphQLAuthorLink = void 0;
const graphql_1 = require("graphql");
const author_1 = require("../db/author");
const common_1 = require("./common");
const image_1 = require("./image");
const slug_1 = require("./slug");
const richText_1 = require("./richText");
const graphql_iso_date_1 = require("graphql-iso-date");
const utility_1 = require("../utility");
exports.GraphQLAuthorLink = new graphql_1.GraphQLObjectType({
    name: 'AuthorLink',
    fields: {
        title: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        url: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) }
    }
});
exports.GraphQLAuthor = new graphql_1.GraphQLObjectType({
    name: 'Author',
    fields: {
        id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
        createdAt: { type: (0, graphql_1.GraphQLNonNull)(graphql_iso_date_1.GraphQLDateTime) },
        modifiedAt: { type: (0, graphql_1.GraphQLNonNull)(graphql_iso_date_1.GraphQLDateTime) },
        name: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        slug: { type: (0, graphql_1.GraphQLNonNull)(slug_1.GraphQLSlug) },
        url: {
            type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString),
            resolve: (0, utility_1.createProxyingResolver)((author, {}, { urlAdapter }) => {
                return urlAdapter.getAuthorURL(author);
            })
        },
        links: { type: (0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(exports.GraphQLAuthorLink)) },
        bio: { type: richText_1.GraphQLRichText },
        jobTitle: { type: graphql_1.GraphQLString },
        image: {
            type: image_1.GraphQLImage,
            resolve: (0, utility_1.createProxyingResolver)(({ imageID }, args, { loaders }) => {
                return imageID ? loaders.images.load(imageID) : null;
            })
        }
    }
});
exports.GraphQLAuthorFilter = new graphql_1.GraphQLInputObjectType({
    name: 'AuthorFilter',
    fields: {
        name: { type: graphql_1.GraphQLString }
    }
});
exports.GraphQLAuthorSort = new graphql_1.GraphQLEnumType({
    name: 'AuthorSort',
    values: {
        CREATED_AT: { value: author_1.AuthorSort.CreatedAt },
        MODIFIED_AT: { value: author_1.AuthorSort.ModifiedAt },
        NAME: { value: author_1.AuthorSort.Name }
    }
});
exports.GraphQLAuthorConnection = new graphql_1.GraphQLObjectType({
    name: 'AuthorConnection',
    fields: {
        nodes: { type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(exports.GraphQLAuthor))) },
        pageInfo: { type: (0, graphql_1.GraphQLNonNull)(common_1.GraphQLPageInfo) },
        totalCount: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLInt) }
    }
});
exports.GraphQLAuthorLinkInput = new graphql_1.GraphQLInputObjectType({
    name: 'AuthorLinkInput',
    fields: {
        title: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        url: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) }
    }
});
exports.GraphQLAuthorInput = new graphql_1.GraphQLInputObjectType({
    name: 'AuthorInput',
    fields: {
        name: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        slug: { type: (0, graphql_1.GraphQLNonNull)(slug_1.GraphQLSlug) },
        links: { type: (0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(exports.GraphQLAuthorLinkInput)) },
        bio: { type: richText_1.GraphQLRichText },
        jobTitle: { type: graphql_1.GraphQLString },
        imageID: { type: graphql_1.GraphQLID }
    }
});
//# sourceMappingURL=author.js.map