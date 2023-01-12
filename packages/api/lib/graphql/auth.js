"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphQLJWTToken = exports.GraphQLAuthProvider = void 0;
const graphql_1 = require("graphql");
exports.GraphQLAuthProvider = new graphql_1.GraphQLObjectType({
    name: 'AuthProvider',
    fields: {
        name: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        url: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) }
    }
});
exports.GraphQLJWTToken = new graphql_1.GraphQLObjectType({
    name: 'JWTToken',
    fields: {
        token: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        expiresAt: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) }
    }
});
//# sourceMappingURL=auth.js.map