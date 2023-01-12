"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphQLWepublishPublicSchema = exports.GraphQLWepublishSchema = void 0;
const graphql_1 = require("graphql");
const query_private_1 = require("./query.private");
const query_public_1 = require("./query.public");
const mutation_private_1 = require("./mutation.private");
const mutation_public_1 = require("./mutation.public");
exports.GraphQLWepublishSchema = new graphql_1.GraphQLSchema({
    query: query_private_1.GraphQLQuery,
    mutation: mutation_private_1.GraphQLAdminMutation
});
exports.GraphQLWepublishPublicSchema = new graphql_1.GraphQLSchema({
    query: query_public_1.GraphQLPublicQuery,
    mutation: mutation_public_1.GraphQLPublicMutation
});
//# sourceMappingURL=schema.js.map