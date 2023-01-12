"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphQLPaymentMethodInput = exports.GraphQLPublicPaymentMethod = exports.GraphQLPaymentMethod = exports.GraphQLPaymentProvider = void 0;
const graphql_1 = require("graphql");
const graphql_iso_date_1 = require("graphql-iso-date");
const utility_1 = require("../utility");
const slug_1 = require("./slug");
exports.GraphQLPaymentProvider = new graphql_1.GraphQLObjectType({
    name: 'PaymentProvider',
    fields: {
        id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
        name: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) }
    }
});
exports.GraphQLPaymentMethod = new graphql_1.GraphQLObjectType({
    name: 'PaymentMethod',
    fields: {
        id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
        createdAt: { type: (0, graphql_1.GraphQLNonNull)(graphql_iso_date_1.GraphQLDateTime) },
        modifiedAt: { type: (0, graphql_1.GraphQLNonNull)(graphql_iso_date_1.GraphQLDateTime) },
        name: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        slug: { type: (0, graphql_1.GraphQLNonNull)(slug_1.GraphQLSlug) },
        description: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        paymentProvider: {
            type: (0, graphql_1.GraphQLNonNull)(exports.GraphQLPaymentProvider),
            resolve: (0, utility_1.createProxyingResolver)(({ paymentProviderID }, {}, { paymentProviders }) => {
                return paymentProviders.find(paymentProvider => paymentProvider.id === paymentProviderID);
            })
        },
        active: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLBoolean) }
    }
});
exports.GraphQLPublicPaymentMethod = new graphql_1.GraphQLObjectType({
    name: 'PaymentMethod',
    fields: {
        id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
        paymentProviderID: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        name: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        slug: { type: (0, graphql_1.GraphQLNonNull)(slug_1.GraphQLSlug) },
        description: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) }
    }
});
exports.GraphQLPaymentMethodInput = new graphql_1.GraphQLInputObjectType({
    name: 'PaymentMethodInput',
    fields: {
        name: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        slug: { type: (0, graphql_1.GraphQLNonNull)(slug_1.GraphQLSlug) },
        description: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        paymentProviderID: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        active: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLBoolean) }
    }
});
//# sourceMappingURL=paymentMethod.js.map