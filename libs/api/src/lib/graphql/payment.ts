import { Payment, PaymentState } from '@prisma/client';
import {
  GraphQLEnumType,
  GraphQLInputObjectType,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import { GraphQLDateTime } from 'graphql-scalars';
import { Context } from '../context';
import { PaymentSort } from '../db/payment';
import { createProxyingResolver } from '../utility';
import { GraphQLPageInfo } from './common';
import { GraphQLInvoice } from './invoice';
import {
  GraphQLPaymentMethod,
  GraphQLPublicPaymentMethod,
} from './paymentMethod';
import { GraphQLSlug } from '@wepublish/utils/api';

export const GraphQLPaymentState = new GraphQLEnumType({
  name: 'PaymentState',
  values: {
    [PaymentState.created]: { value: PaymentState.created },
    [PaymentState.submitted]: { value: PaymentState.submitted },
    [PaymentState.requiresUserAction]: {
      value: PaymentState.requiresUserAction,
    },
    [PaymentState.processing]: { value: PaymentState.processing },
    [PaymentState.paid]: { value: PaymentState.paid },
    [PaymentState.canceled]: { value: PaymentState.canceled },
    [PaymentState.declined]: { value: PaymentState.declined },
  },
});

export const GraphQLPublicPayment = new GraphQLObjectType<Payment, Context>({
  name: 'Payment',
  fields: {
    id: { type: new GraphQLNonNull(GraphQLString) },

    intentSecret: { type: GraphQLString },
    state: { type: new GraphQLNonNull(GraphQLPaymentState) },

    paymentMethod: {
      type: new GraphQLNonNull(GraphQLPublicPaymentMethod),
      resolve: createProxyingResolver(({ paymentMethodID }, _, { loaders }) => {
        return loaders.paymentMethodsByID.load(paymentMethodID);
      }),
    },
  },
});

export const GraphQLPayment = new GraphQLObjectType<Payment, Context>({
  name: 'Payment',
  fields: {
    id: { type: new GraphQLNonNull(GraphQLString) },

    createdAt: { type: new GraphQLNonNull(GraphQLDateTime) },
    modifiedAt: { type: new GraphQLNonNull(GraphQLDateTime) },

    intentID: { type: GraphQLString },
    intentSecret: { type: GraphQLString },
    state: { type: new GraphQLNonNull(GraphQLPaymentState) },
    invoice: {
      type: new GraphQLNonNull(GraphQLInvoice),
      resolve: createProxyingResolver(({ invoiceID }, _, { loaders }) => {
        return loaders.invoicesByID.load(invoiceID);
      }),
    },
    intentData: { type: GraphQLString },
    paymentMethod: {
      type: new GraphQLNonNull(GraphQLPaymentMethod),
      resolve: createProxyingResolver(({ paymentMethodID }, _, { loaders }) => {
        return loaders.paymentMethodsByID.load(paymentMethodID);
      }),
    },
    paymentData: { type: GraphQLString },
  },
});

export const GraphQLPaymentFilter = new GraphQLInputObjectType({
  name: 'PaymentFilter',
  fields: {
    intentID: { type: GraphQLString },
  },
});

export const GraphQLPaymentSort = new GraphQLEnumType({
  name: 'PaymentSort',
  values: {
    [PaymentSort.CreatedAt]: { value: PaymentSort.CreatedAt },
    [PaymentSort.ModifiedAt]: { value: PaymentSort.ModifiedAt },
  },
});

export const GraphQLPaymentConnection = new GraphQLObjectType<any, Context>({
  name: 'PaymentConnection',
  fields: {
    nodes: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(GraphQLPayment))
      ),
    },
    pageInfo: { type: new GraphQLNonNull(GraphQLPageInfo) },
    totalCount: { type: new GraphQLNonNull(GraphQLInt) },
  },
});

export const GraphQLPaymentFromInvoiceInput = new GraphQLInputObjectType({
  name: 'PaymentFromInvoiceInput',
  fields: {
    invoiceID: { type: new GraphQLNonNull(GraphQLString) },
    paymentMethodID: { type: GraphQLString },
    paymentMethodSlug: { type: GraphQLSlug },
    successURL: { type: GraphQLString },
    failureURL: { type: GraphQLString },
  },
});
