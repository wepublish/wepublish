import { MemberPlan, MemberPlanSort } from '../db/memberPlan';

import { GraphQLRichText } from '@wepublish/richtext/api';
import { GraphQLImage } from './image';
import { Context } from '../context';
import { createProxyingResolver } from '../utility';
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
import { GraphQLPageInfo } from './common';
import { GraphQLPaymentMethod } from './paymentMethod';
import {
  AvailablePaymentMethod,
  Currency,
  PaymentPeriodicity,
} from '@prisma/client';

export const GraphQLSupportedCurrency = new GraphQLEnumType({
  name: 'Currency',
  values: {
    CHF: { value: Currency.CHF },
    EUR: { value: Currency.EUR },
  },
});

export const GraphQLPaymentPeriodicity = new GraphQLEnumType({
  name: 'PaymentPeriodicity',
  values: {
    [PaymentPeriodicity.monthly]: { value: PaymentPeriodicity.monthly },
    [PaymentPeriodicity.quarterly]: { value: PaymentPeriodicity.quarterly },
    [PaymentPeriodicity.biannual]: { value: PaymentPeriodicity.biannual },
    [PaymentPeriodicity.yearly]: { value: PaymentPeriodicity.yearly },
    [PaymentPeriodicity.biennial]: { value: PaymentPeriodicity.biennial },
    [PaymentPeriodicity.lifetime]: { value: PaymentPeriodicity.lifetime },
  },
});

export const GraphQLAvailablePaymentMethod = new GraphQLObjectType<
  AvailablePaymentMethod,
  Context
>({
  name: 'AvailablePaymentMethod',
  fields: () => ({
    paymentMethods: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(GraphQLPaymentMethod))
      ),
      async resolve({ paymentMethodIDs }, args, { prisma: { paymentMethod } }) {
        const paymentMethods = await paymentMethod.findMany({
          where: {
            id: {
              in: paymentMethodIDs,
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

        return paymentMethods;
      },
    },
    paymentPeriodicities: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(GraphQLPaymentPeriodicity))
      ),
    },
    forceAutoRenewal: { type: new GraphQLNonNull(GraphQLBoolean) },
  }),
});

export const GraphQLMemberPlan = new GraphQLObjectType<MemberPlan, Context>({
  name: 'MemberPlan',
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLString) },

    createdAt: { type: new GraphQLNonNull(GraphQLDateTime) },
    modifiedAt: { type: new GraphQLNonNull(GraphQLDateTime) },

    name: { type: new GraphQLNonNull(GraphQLString) },
    slug: { type: new GraphQLNonNull(GraphQLString) },
    image: {
      type: GraphQLImage,
      resolve: createProxyingResolver(({ imageID }, args, { loaders }) => {
        return imageID ? loaders.images.load(imageID) : null;
      }),
    },
    description: { type: GraphQLRichText },
    shortDescription: { type: GraphQLRichText },
    tags: { type: new GraphQLList(new GraphQLNonNull(GraphQLString)) },
    active: { type: new GraphQLNonNull(GraphQLBoolean) },
    amountPerMonthMin: { type: new GraphQLNonNull(GraphQLInt) },
    amountPerMonthTarget: { type: GraphQLInt },
    currency: { type: new GraphQLNonNull(GraphQLSupportedCurrency) },
    maxCount: { type: GraphQLInt },
    extendable: { type: new GraphQLNonNull(GraphQLBoolean) },
    availablePaymentMethods: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(GraphQLAvailablePaymentMethod))
      ),
    },
    migrateToTargetPaymentMethodID: { type: GraphQLString },
    successPageId: { type: GraphQLString },
    // successPage: {
    //   type: GraphQLPage,
    //   resolve: createProxyingResolver(({successPageId}, args, {loaders}) => {
    //     return successPageId ? loaders.pages.load(successPageId) : null
    //   })
    // },
    failPageId: { type: GraphQLString },
    // failPage: {
    //   type: GraphQLPage,
    //   resolve: createProxyingResolver(({failPageId}, args, {loaders}) => {
    //     return failPageId ? loaders.pages.load(failPageId) : null
    //   })
    // },
    confirmationPageId: { type: GraphQLString },
    // confirmationPage: {
    //   type: GraphQLPage,
    //   resolve: createProxyingResolver(({confirmationPageId}, args, {loaders}) => {
    //     return confirmationPageId ? loaders.pages.load(confirmationPageId) : null
    //   })
    // }
  }),
});

export const GraphQLMemberPlanFilter = new GraphQLInputObjectType({
  name: 'MemberPlanFilter',
  fields: () => ({
    name: { type: GraphQLString },
    active: { type: GraphQLBoolean },
    tags: { type: new GraphQLList(new GraphQLNonNull(GraphQLString)) },
  }),
});

export const GraphQLMemberPlanSort = new GraphQLEnumType({
  name: 'MemberPlanSort',
  values: {
    [MemberPlanSort.CreatedAt]: { value: MemberPlanSort.CreatedAt },
    [MemberPlanSort.ModifiedAt]: { value: MemberPlanSort.ModifiedAt },
  },
});

export const GraphQLMemberPlanConnection = new GraphQLObjectType<any, Context>({
  name: 'MemberPlanConnection',
  fields: () => ({
    nodes: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(GraphQLMemberPlan))
      ),
    },
    pageInfo: { type: new GraphQLNonNull(GraphQLPageInfo) },
    totalCount: { type: new GraphQLNonNull(GraphQLInt) },
  }),
});

export const GraphQLAvailablePaymentMethodInput = new GraphQLInputObjectType({
  name: 'AvailablePaymentMethodInput',
  fields: () => ({
    paymentMethodIDs: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(GraphQLString))
      ),
    },
    paymentPeriodicities: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(GraphQLPaymentPeriodicity))
      ),
    },
    forceAutoRenewal: { type: new GraphQLNonNull(GraphQLBoolean) },
  }),
});

export const GraphQLMemberPlanInput = new GraphQLInputObjectType({
  name: 'MemberPlanInput',
  fields: () => ({
    name: { type: new GraphQLNonNull(GraphQLString) },
    slug: { type: new GraphQLNonNull(GraphQLString) },
    imageID: { type: GraphQLString },
    description: { type: GraphQLRichText },
    shortDescription: { type: GraphQLRichText },
    tags: { type: new GraphQLList(new GraphQLNonNull(GraphQLString)) },
    active: { type: new GraphQLNonNull(GraphQLBoolean) },
    amountPerMonthMin: { type: new GraphQLNonNull(GraphQLInt) },
    amountPerMonthTarget: { type: GraphQLInt },
    currency: { type: new GraphQLNonNull(GraphQLSupportedCurrency) },
    extendable: { type: new GraphQLNonNull(GraphQLBoolean) },
    maxCount: { type: GraphQLInt },
    availablePaymentMethods: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(GraphQLAvailablePaymentMethodInput))
      ),
    },
    migrateToTargetPaymentMethodID: { type: GraphQLString },
    successPageId: { type: GraphQLString },
    failPageId: { type: GraphQLString },
    confirmationPageId: { type: GraphQLString },
  }),
});
