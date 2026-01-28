import { InvoiceItem } from '@prisma/client';
import {
  GraphQLEnumType,
  GraphQLInputObjectType,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import { GraphQLDate, GraphQLDateTime } from 'graphql-scalars';
import { Context } from '../context';
import { InvoiceSort } from '../db/invoice';
import { InvoiceWithItems } from '@wepublish/payment/api';
import { createProxyingResolver } from '../utility';
import { GraphQLPageInfo } from './common';
import { GraphQLSupportedCurrency } from './memberPlan';

export const GraphQLInvoiceItem = new GraphQLObjectType<InvoiceItem, Context>({
  name: 'InvoiceItem',
  fields: {
    createdAt: { type: new GraphQLNonNull(GraphQLDateTime) },
    modifiedAt: { type: new GraphQLNonNull(GraphQLDateTime) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    description: { type: GraphQLString },
    quantity: { type: new GraphQLNonNull(GraphQLInt) },
    amount: { type: new GraphQLNonNull(GraphQLInt) },
    total: {
      type: new GraphQLNonNull(GraphQLInt),
      resolve: createProxyingResolver(({ amount, quantity }) => {
        return amount * quantity;
      }),
    },
  },
});

export const GraphQLInvoice = new GraphQLObjectType<InvoiceWithItems, Context>({
  name: 'Invoice',
  fields: {
    id: { type: new GraphQLNonNull(GraphQLString) },

    createdAt: { type: new GraphQLNonNull(GraphQLDateTime) },
    modifiedAt: { type: new GraphQLNonNull(GraphQLDateTime) },

    mail: { type: new GraphQLNonNull(GraphQLString) },
    description: { type: GraphQLString },
    paidAt: { type: GraphQLDateTime },
    manuallySetAsPaidByUserId: { type: GraphQLString },
    items: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(GraphQLInvoiceItem))
      ),
    },
    canceledAt: { type: GraphQLDateTime },
    currency: { type: new GraphQLNonNull(GraphQLSupportedCurrency) },
    total: {
      type: new GraphQLNonNull(GraphQLInt),
      resolve: createProxyingResolver(({ items }) => {
        return (items || []).reduce((previousValue, currentValue) => {
          return previousValue + currentValue.quantity * currentValue.amount;
        }, 0);
      }),
    },
  },
});

export const GraphQLinvoiceFilter = new GraphQLInputObjectType({
  name: 'InvoiceFilter',
  fields: {
    mail: { type: GraphQLString },
    paidAt: { type: GraphQLDate },
    canceledAt: { type: GraphQLDate },
    userID: { type: GraphQLString },
    subscriptionID: { type: GraphQLString },
  },
});

export const GraphQLInvoiceSort = new GraphQLEnumType({
  name: 'InvoiceSort',
  values: {
    [InvoiceSort.CreatedAt]: { value: InvoiceSort.CreatedAt },
    [InvoiceSort.ModifiedAt]: { value: InvoiceSort.ModifiedAt },
    [InvoiceSort.PaidAt]: { value: InvoiceSort.PaidAt },
  },
});

export const GraphQLInvoiceConnection = new GraphQLObjectType<any, Context>({
  name: 'InvoiceConnection',
  fields: {
    nodes: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(GraphQLInvoice))
      ),
    },
    pageInfo: { type: new GraphQLNonNull(GraphQLPageInfo) },
    totalCount: { type: new GraphQLNonNull(GraphQLInt) },
  },
});

export const GraphQLInvoiceItemInput = new GraphQLInputObjectType({
  name: 'InvoiceItemInput',
  fields: {
    name: { type: new GraphQLNonNull(GraphQLString) },
    description: { type: GraphQLString },
    quantity: { type: new GraphQLNonNull(GraphQLInt) },
    amount: { type: new GraphQLNonNull(GraphQLInt) },
    createdAt: { type: new GraphQLNonNull(GraphQLDateTime) },
    modifiedAt: { type: new GraphQLNonNull(GraphQLDateTime) },
  },
});

export const GraphQLInvoiceInput = new GraphQLInputObjectType({
  name: 'InvoiceInput',
  fields: {
    mail: { type: new GraphQLNonNull(GraphQLString) },
    description: { type: GraphQLString },
    subscriptionID: { type: GraphQLString },
    manuallySetAsPaidByUserId: { type: GraphQLString },
    items: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(GraphQLInvoiceItemInput))
      ),
    },
  },
});
