"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphQLChallenge = void 0;
const graphql_1 = require("graphql");
const graphql_iso_date_1 = require("graphql-iso-date");
exports.GraphQLChallenge = new graphql_1.GraphQLObjectType({
    name: 'Challenge',
    fields: () => ({
        challenge: { type: graphql_1.GraphQLString },
        challengeID: { type: graphql_1.GraphQLString },
        validUntil: { type: graphql_iso_date_1.GraphQLDate }
    })
});
//# sourceMappingURL=challenge.js.map