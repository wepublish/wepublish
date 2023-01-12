"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphQLTagSort = exports.GraphQLTagFilter = exports.GraphQLTagConnection = exports.GraphQLTag = exports.GraphQLTagType = void 0;
const client_1 = require("@prisma/client");
const graphql_1 = require("graphql");
const common_1 = require("../common");
const tag_private_query_1 = require("./tag.private-query");
exports.GraphQLTagType = new graphql_1.GraphQLEnumType({
    name: 'TagType',
    values: {
        Comment: { value: client_1.TagType.Comment }
    }
});
exports.GraphQLTag = new graphql_1.GraphQLObjectType({
    name: 'Tag',
    fields: {
        id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
        tag: { type: graphql_1.GraphQLString },
        type: { type: exports.GraphQLTagType }
    }
});
exports.GraphQLTagConnection = new graphql_1.GraphQLObjectType({
    name: 'TagConnection',
    fields: {
        nodes: { type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(exports.GraphQLTag))) },
        pageInfo: { type: (0, graphql_1.GraphQLNonNull)(common_1.GraphQLPageInfo) },
        totalCount: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLInt) }
    }
});
exports.GraphQLTagFilter = new graphql_1.GraphQLInputObjectType({
    name: 'TagFilter',
    fields: {
        type: { type: exports.GraphQLTagType },
        tag: { type: graphql_1.GraphQLString }
    }
});
exports.GraphQLTagSort = new graphql_1.GraphQLEnumType({
    name: 'TagSort',
    values: {
        CREATED_AT: { value: tag_private_query_1.TagSort.CreatedAt },
        MODIFIED_AT: { value: tag_private_query_1.TagSort.ModifiedAt },
        TAG: { value: tag_private_query_1.TagSort.Tag }
    }
});
//# sourceMappingURL=tag.js.map