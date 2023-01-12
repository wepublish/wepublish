"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphQLSubscriptionPeriod = void 0;
const graphql_1 = require("graphql");
const graphql_iso_date_1 = require("graphql-iso-date");
const memberPlan_1 = require("./memberPlan");
exports.GraphQLSubscriptionPeriod = new graphql_1.GraphQLObjectType({
    name: 'SubscriptionPeriod',
    fields: {
        id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
        invoiceID: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
        amount: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLInt) },
        createdAt: { type: (0, graphql_1.GraphQLNonNull)(graphql_iso_date_1.GraphQLDateTime) },
        startsAt: { type: (0, graphql_1.GraphQLNonNull)(graphql_iso_date_1.GraphQLDateTime) },
        endsAt: { type: (0, graphql_1.GraphQLNonNull)(graphql_iso_date_1.GraphQLDateTime) },
        paymentPeriodicity: { type: (0, graphql_1.GraphQLNonNull)(memberPlan_1.GraphQLPaymentPeriodicity) }
    }
});
//# sourceMappingURL=subscriptionPeriods.js.map