"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphQLSubscriptionDeactivation = exports.GraphQLSubscriptionDeactivationReason = void 0;
const client_1 = require("@prisma/client");
const graphql_1 = require("graphql");
const graphql_iso_date_1 = require("graphql-iso-date");
exports.GraphQLSubscriptionDeactivationReason = new graphql_1.GraphQLEnumType({
    name: 'SubscriptionDeactivationReason',
    values: {
        NONE: { value: client_1.SubscriptionDeactivationReason.none },
        USER_SELF_DEACTIVATED: { value: client_1.SubscriptionDeactivationReason.userSelfDeactivated },
        INVOICE_NOT_PAID: { value: client_1.SubscriptionDeactivationReason.invoiceNotPaid }
    }
});
exports.GraphQLSubscriptionDeactivation = new graphql_1.GraphQLObjectType({
    name: 'SubscriptionDeactivation',
    fields: {
        date: { type: (0, graphql_1.GraphQLNonNull)(graphql_iso_date_1.GraphQLDateTime) },
        reason: { type: (0, graphql_1.GraphQLNonNull)(exports.GraphQLSubscriptionDeactivationReason) }
    }
});
//# sourceMappingURL=subscriptionDeactivation.js.map