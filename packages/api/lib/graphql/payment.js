"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphQLPaymentFromInvoiceInput = exports.GraphQLPaymentConnection = exports.GraphQLPaymentSort = exports.GraphQLPaymentFilter = exports.GraphQLPayment = exports.GraphQLPublicPayment = exports.GraphQLPaymentState = void 0;
const client_1 = require("@prisma/client");
const graphql_1 = require("graphql");
const graphql_iso_date_1 = require("graphql-iso-date");
const payment_1 = require("../db/payment");
const utility_1 = require("../utility");
const common_1 = require("./common");
const invoice_1 = require("./invoice");
const paymentMethod_1 = require("./paymentMethod");
const slug_1 = require("./slug");
exports.GraphQLPaymentState = new graphql_1.GraphQLEnumType({
    name: 'PaymentState',
    values: {
        Created: { value: client_1.PaymentState.created },
        Submitted: { value: client_1.PaymentState.submitted },
        RequiresUserAction: { value: client_1.PaymentState.requiresUserAction },
        Processing: { value: client_1.PaymentState.processing },
        Paid: { value: client_1.PaymentState.paid },
        Canceled: { value: client_1.PaymentState.canceled },
        Declined: { value: client_1.PaymentState.declined }
    }
});
exports.GraphQLPublicPayment = new graphql_1.GraphQLObjectType({
    name: 'Payment',
    fields: {
        id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
        intentSecret: { type: graphql_1.GraphQLString },
        state: { type: (0, graphql_1.GraphQLNonNull)(exports.GraphQLPaymentState) },
        paymentMethod: {
            type: (0, graphql_1.GraphQLNonNull)(paymentMethod_1.GraphQLPublicPaymentMethod),
            resolve: (0, utility_1.createProxyingResolver)(({ paymentMethodID }, {}, { loaders }) => {
                return loaders.paymentMethodsByID.load(paymentMethodID);
            })
        }
    }
});
exports.GraphQLPayment = new graphql_1.GraphQLObjectType({
    name: 'Payment',
    fields: {
        id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
        createdAt: { type: (0, graphql_1.GraphQLNonNull)(graphql_iso_date_1.GraphQLDateTime) },
        modifiedAt: { type: (0, graphql_1.GraphQLNonNull)(graphql_iso_date_1.GraphQLDateTime) },
        intentID: { type: graphql_1.GraphQLString },
        intentSecret: { type: graphql_1.GraphQLString },
        state: { type: (0, graphql_1.GraphQLNonNull)(exports.GraphQLPaymentState) },
        invoice: {
            type: (0, graphql_1.GraphQLNonNull)(invoice_1.GraphQLInvoice),
            resolve: (0, utility_1.createProxyingResolver)(({ invoiceID }, {}, { loaders }) => {
                return loaders.invoicesByID.load(invoiceID);
            })
        },
        intentData: { type: graphql_1.GraphQLString },
        paymentMethod: {
            type: (0, graphql_1.GraphQLNonNull)(paymentMethod_1.GraphQLPaymentMethod),
            resolve: (0, utility_1.createProxyingResolver)(({ paymentMethodID }, {}, { loaders }) => {
                return loaders.paymentMethodsByID.load(paymentMethodID);
            })
        },
        paymentData: { type: graphql_1.GraphQLString }
    }
});
exports.GraphQLPaymentFilter = new graphql_1.GraphQLInputObjectType({
    name: 'PaymentFilter',
    fields: {
        intentID: { type: graphql_1.GraphQLString }
    }
});
exports.GraphQLPaymentSort = new graphql_1.GraphQLEnumType({
    name: 'PaymentSort',
    values: {
        CREATED_AT: { value: payment_1.PaymentSort.CreatedAt },
        MODIFIED_AT: { value: payment_1.PaymentSort.ModifiedAt }
    }
});
exports.GraphQLPaymentConnection = new graphql_1.GraphQLObjectType({
    name: 'PaymentConnection',
    fields: {
        nodes: { type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(exports.GraphQLPayment))) },
        pageInfo: { type: (0, graphql_1.GraphQLNonNull)(common_1.GraphQLPageInfo) },
        totalCount: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLInt) }
    }
});
exports.GraphQLPaymentFromInvoiceInput = new graphql_1.GraphQLInputObjectType({
    name: 'PaymentFromInvoiceInput',
    fields: {
        invoiceID: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        paymentMethodID: { type: graphql_1.GraphQLID },
        paymentMethodSlug: { type: slug_1.GraphQLSlug },
        successURL: { type: graphql_1.GraphQLString },
        failureURL: { type: graphql_1.GraphQLString }
    }
});
//# sourceMappingURL=payment.js.map