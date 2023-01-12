"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphQLSession = exports.GraphQLPublicSessionWithToken = exports.GraphQLSessionWithToken = void 0;
const graphql_1 = require("graphql");
const graphql_iso_date_1 = require("graphql-iso-date");
const user_1 = require("./user");
exports.GraphQLSessionWithToken = new graphql_1.GraphQLObjectType({
    name: 'SessionWithToken',
    fields: {
        id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
        user: { type: (0, graphql_1.GraphQLNonNull)(user_1.GraphQLUser) },
        token: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        createdAt: { type: (0, graphql_1.GraphQLNonNull)(graphql_iso_date_1.GraphQLDateTime) },
        expiresAt: { type: (0, graphql_1.GraphQLNonNull)(graphql_iso_date_1.GraphQLDateTime) }
    }
});
exports.GraphQLPublicSessionWithToken = new graphql_1.GraphQLObjectType({
    name: 'SessionWithToken',
    fields: {
        user: { type: (0, graphql_1.GraphQLNonNull)(user_1.GraphQLPublicUser) },
        token: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        createdAt: { type: (0, graphql_1.GraphQLNonNull)(graphql_iso_date_1.GraphQLDateTime) },
        expiresAt: { type: (0, graphql_1.GraphQLNonNull)(graphql_iso_date_1.GraphQLDateTime) }
    }
});
exports.GraphQLSession = new graphql_1.GraphQLObjectType({
    name: 'Session',
    fields: {
        id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
        user: { type: (0, graphql_1.GraphQLNonNull)(user_1.GraphQLUser) },
        createdAt: { type: (0, graphql_1.GraphQLNonNull)(graphql_iso_date_1.GraphQLDateTime) },
        expiresAt: { type: (0, graphql_1.GraphQLNonNull)(graphql_iso_date_1.GraphQLDateTime) }
    }
});
//# sourceMappingURL=session.js.map