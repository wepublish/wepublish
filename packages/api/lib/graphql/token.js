"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphQLCreatedToken = exports.GraphQLToken = exports.GraphQLTokenInput = void 0;
const graphql_1 = require("graphql");
const graphql_iso_date_1 = require("graphql-iso-date");
exports.GraphQLTokenInput = new graphql_1.GraphQLInputObjectType({
    name: 'TokenInput',
    fields: {
        name: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) }
    }
});
exports.GraphQLToken = new graphql_1.GraphQLObjectType({
    name: 'Token',
    fields: {
        id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
        createdAt: { type: (0, graphql_1.GraphQLNonNull)(graphql_iso_date_1.GraphQLDateTime) },
        modifiedAt: { type: (0, graphql_1.GraphQLNonNull)(graphql_iso_date_1.GraphQLDateTime) },
        name: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) }
    }
});
exports.GraphQLCreatedToken = new graphql_1.GraphQLObjectType({
    name: 'CreatedToken',
    fields: {
        id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
        createdAt: { type: (0, graphql_1.GraphQLNonNull)(graphql_iso_date_1.GraphQLDateTime) },
        modifiedAt: { type: (0, graphql_1.GraphQLNonNull)(graphql_iso_date_1.GraphQLDateTime) },
        name: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        token: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) }
    }
});
//# sourceMappingURL=token.js.map