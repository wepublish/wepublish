"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphQLInvoiceInput = exports.GraphQLInvoiceItemInput = exports.GraphQLInvoiceConnection = exports.GraphQLInvoiceSort = exports.GraphQLinvoiceFilter = exports.GraphQLPublicInvoice = exports.GraphQLInvoice = exports.GraphQLInvoiceItem = void 0;
const graphql_1 = require("graphql");
const graphql_iso_date_1 = require("graphql-iso-date");
const invoice_1 = require("../db/invoice");
const utility_1 = require("../utility");
const common_1 = require("./common");
exports.GraphQLInvoiceItem = new graphql_1.GraphQLObjectType({
    name: 'InvoiceItem',
    fields: {
        createdAt: { type: (0, graphql_1.GraphQLNonNull)(graphql_iso_date_1.GraphQLDateTime) },
        modifiedAt: { type: (0, graphql_1.GraphQLNonNull)(graphql_iso_date_1.GraphQLDateTime) },
        name: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        description: { type: graphql_1.GraphQLString },
        quantity: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLInt) },
        amount: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLInt) },
        total: {
            type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLInt),
            resolve: (0, utility_1.createProxyingResolver)(({ amount, quantity }) => {
                return amount * quantity;
            })
        }
    }
});
exports.GraphQLInvoice = new graphql_1.GraphQLObjectType({
    name: 'Invoice',
    fields: {
        id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
        createdAt: { type: (0, graphql_1.GraphQLNonNull)(graphql_iso_date_1.GraphQLDateTime) },
        modifiedAt: { type: (0, graphql_1.GraphQLNonNull)(graphql_iso_date_1.GraphQLDateTime) },
        mail: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        description: { type: graphql_1.GraphQLString },
        paidAt: { type: graphql_iso_date_1.GraphQLDateTime },
        manuallySetAsPaidByUserId: { type: graphql_1.GraphQLID },
        items: { type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(exports.GraphQLInvoiceItem))) },
        canceledAt: { type: graphql_iso_date_1.GraphQLDateTime },
        total: {
            type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLInt),
            resolve: (0, utility_1.createProxyingResolver)(({ items }) => {
                return (items || []).reduce((previousValue, currentValue) => {
                    return previousValue + currentValue.quantity * currentValue.amount;
                }, 0);
            })
        }
    }
});
exports.GraphQLPublicInvoice = new graphql_1.GraphQLObjectType({
    name: 'Invoice',
    fields: {
        id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
        createdAt: { type: (0, graphql_1.GraphQLNonNull)(graphql_iso_date_1.GraphQLDateTime) },
        modifiedAt: { type: (0, graphql_1.GraphQLNonNull)(graphql_iso_date_1.GraphQLDateTime) },
        mail: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        description: { type: graphql_1.GraphQLString },
        paidAt: { type: graphql_iso_date_1.GraphQLDateTime },
        canceledAt: { type: graphql_iso_date_1.GraphQLDateTime },
        items: { type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(exports.GraphQLInvoiceItem))) },
        subscriptionID: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
        total: {
            type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLInt),
            resolve: (0, utility_1.createProxyingResolver)(({ items }) => {
                return (items || []).reduce((previousValue, currentValue) => {
                    return previousValue + currentValue.quantity * currentValue.amount;
                }, 0);
            })
        }
    }
});
exports.GraphQLinvoiceFilter = new graphql_1.GraphQLInputObjectType({
    name: 'InvoiceFilter',
    fields: {
        mail: { type: graphql_1.GraphQLString },
        paidAt: { type: graphql_iso_date_1.GraphQLDate },
        canceledAt: { type: graphql_iso_date_1.GraphQLDate },
        userID: { type: graphql_1.GraphQLID },
        subscriptionID: { type: graphql_1.GraphQLID }
    }
});
exports.GraphQLInvoiceSort = new graphql_1.GraphQLEnumType({
    name: 'InvoiceSort',
    values: {
        CREATED_AT: { value: invoice_1.InvoiceSort.CreatedAt },
        MODIFIED_AT: { value: invoice_1.InvoiceSort.ModifiedAt },
        PAID_AT: { value: invoice_1.InvoiceSort.PaidAt }
    }
});
exports.GraphQLInvoiceConnection = new graphql_1.GraphQLObjectType({
    name: 'InvoiceConnection',
    fields: {
        nodes: { type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(exports.GraphQLInvoice))) },
        pageInfo: { type: (0, graphql_1.GraphQLNonNull)(common_1.GraphQLPageInfo) },
        totalCount: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLInt) }
    }
});
exports.GraphQLInvoiceItemInput = new graphql_1.GraphQLInputObjectType({
    name: 'InvoiceItemInput',
    fields: {
        name: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        description: { type: graphql_1.GraphQLString },
        quantity: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLInt) },
        amount: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLInt) },
        createdAt: { type: (0, graphql_1.GraphQLNonNull)(graphql_iso_date_1.GraphQLDateTime) },
        modifiedAt: { type: (0, graphql_1.GraphQLNonNull)(graphql_iso_date_1.GraphQLDateTime) }
    }
});
exports.GraphQLInvoiceInput = new graphql_1.GraphQLInputObjectType({
    name: 'InvoiceInput',
    fields: {
        mail: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        description: { type: graphql_1.GraphQLString },
        paidAt: { type: graphql_iso_date_1.GraphQLDateTime },
        subscriptionID: { type: graphql_1.GraphQLID },
        manuallySetAsPaidByUserId: { type: graphql_1.GraphQLID },
        items: { type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(exports.GraphQLInvoiceItemInput))) }
    }
});
//# sourceMappingURL=invoice.js.map