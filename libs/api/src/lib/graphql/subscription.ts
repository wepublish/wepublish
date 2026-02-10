import { Subscription } from '@prisma/client';
import { unselectPassword } from '@wepublish/authentication/api';
import {
  GraphQLBoolean,
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
import { SubscribersPerMonth, SubscriptionSort } from '../db/subscription';
import {
  GraphQLDateFilter,
  GraphQLMetadataProperty,
  GraphQLMetadataPropertyInput,
  GraphQLPageInfo,
} from './common';
import {
  GraphQLMemberPlan,
  GraphQLPaymentPeriodicity,
  GraphQLSupportedCurrency,
} from './memberPlan';
import { GraphQLPaymentMethod } from './paymentMethod';
import {
  GraphQLSubscriptionDeactivation,
  GraphQLSubscriptionDeactivationReason,
} from './subscriptionDeactivation';
import { GraphQLUser } from './user';

export const GraphQLSubscription = new GraphQLObjectType<Subscription, Context>(
  {
    name: 'Subscription',
    fields: {
      id: { type: new GraphQLNonNull(GraphQLString) },
      createdAt: { type: new GraphQLNonNull(GraphQLDateTime) },
      modifiedAt: { type: new GraphQLNonNull(GraphQLDateTime) },
      user: {
        type: GraphQLUser,
        async resolve({ userID }, args, { prisma }) {
          return prisma.user.findUnique({
            where: {
              id: userID,
            },
            select: unselectPassword,
          });
        },
      },
      memberPlan: {
        type: new GraphQLNonNull(GraphQLMemberPlan),
        resolve({ memberPlanID }, args, { loaders }) {
          return loaders.memberPlansByID.load(memberPlanID);
        },
      },
      paymentPeriodicity: {
        type: new GraphQLNonNull(GraphQLPaymentPeriodicity),
      },
      monthlyAmount: { type: new GraphQLNonNull(GraphQLInt) },
      autoRenew: { type: new GraphQLNonNull(GraphQLBoolean) },
      extendable: { type: new GraphQLNonNull(GraphQLBoolean) },
      startsAt: { type: new GraphQLNonNull(GraphQLDateTime) },
      paidUntil: { type: GraphQLDateTime },
      paymentMethod: {
        type: new GraphQLNonNull(GraphQLPaymentMethod),
        resolve({ paymentMethodID }, args, { loaders }) {
          return loaders.paymentMethodsByID.load(paymentMethodID);
        },
      },
      properties: {
        type: new GraphQLNonNull(
          new GraphQLList(new GraphQLNonNull(GraphQLMetadataProperty))
        ),
      },
      deactivation: { type: GraphQLSubscriptionDeactivation },
      currency: { type: new GraphQLNonNull(GraphQLSupportedCurrency) },
    },
  }
);

export const GraphQLSubscriptionFilter = new GraphQLInputObjectType({
  name: 'SubscriptionFilter',
  fields: {
    startsAt: { type: GraphQLDateFilter },
    paidUntil: { type: GraphQLDateFilter },
    startsAtFrom: { type: GraphQLDateFilter },
    startsAtTo: { type: GraphQLDateFilter },
    paidUntilFrom: { type: GraphQLDateFilter },
    paidUntilTo: { type: GraphQLDateFilter },
    deactivationDateFrom: { type: GraphQLDateFilter },
    deactivationDateTo: { type: GraphQLDateFilter },
    cancellationDateFrom: { type: GraphQLDateFilter },
    cancellationDateTo: { type: GraphQLDateFilter },
    deactivationReason: { type: GraphQLSubscriptionDeactivationReason },
    autoRenew: { type: GraphQLBoolean },
    paymentMethodID: { type: GraphQLString },
    memberPlanID: { type: GraphQLString },
    paymentPeriodicity: { type: GraphQLPaymentPeriodicity },
    userHasAddress: { type: GraphQLBoolean },
    userID: { type: GraphQLString },
    userIDs: { type: new GraphQLList(new GraphQLNonNull(GraphQLString)) },
    subscriptionIDs: {
      type: new GraphQLList(new GraphQLNonNull(GraphQLString)),
    },
    extendable: { type: GraphQLBoolean },
  },
});

export const GraphQLSubscriptionSort = new GraphQLEnumType({
  name: 'SubscriptionSort',
  values: {
    [SubscriptionSort.CreatedAt]: { value: SubscriptionSort.CreatedAt },
    [SubscriptionSort.ModifiedAt]: { value: SubscriptionSort.ModifiedAt },
  },
});

export const GraphQLSubscriptionConnection = new GraphQLObjectType<
  any,
  Context
>({
  name: 'SubscriptionConnection',
  fields: {
    nodes: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(GraphQLSubscription))
      ),
    },
    pageInfo: { type: new GraphQLNonNull(GraphQLPageInfo) },
    totalCount: { type: new GraphQLNonNull(GraphQLInt) },
  },
});

export const GraphQLSubscriptionDeactivationInput = new GraphQLInputObjectType({
  name: 'SubscriptionDeactivationInput',
  fields: {
    date: { type: new GraphQLNonNull(GraphQLDateTime) },
    reason: { type: new GraphQLNonNull(GraphQLSubscriptionDeactivationReason) },
  },
});

export const GraphQLSubscriptionInput = new GraphQLInputObjectType({
  name: 'SubscriptionInput',
  fields: {
    userID: { type: new GraphQLNonNull(GraphQLString) },
    memberPlanID: { type: new GraphQLNonNull(GraphQLString) },
    paymentPeriodicity: { type: new GraphQLNonNull(GraphQLPaymentPeriodicity) },
    monthlyAmount: { type: new GraphQLNonNull(GraphQLInt) },
    autoRenew: { type: new GraphQLNonNull(GraphQLBoolean) },
    startsAt: { type: new GraphQLNonNull(GraphQLDateTime) },
    paidUntil: { type: GraphQLDateTime },
    paymentMethodID: { type: new GraphQLNonNull(GraphQLString) },
    extendable: { type: new GraphQLNonNull(GraphQLBoolean) },
    properties: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(GraphQLMetadataPropertyInput))
      ),
    },
    deactivation: { type: GraphQLSubscriptionDeactivationInput },
  },
});

export const GraphQLSubscribersPerMonth = new GraphQLObjectType<
  SubscribersPerMonth,
  Context
>({
  name: 'SubscribersPerMonth',
  fields: {
    month: { type: new GraphQLNonNull(GraphQLString) },
    subscriberCount: { type: new GraphQLNonNull(GraphQLInt) },
  },
});
