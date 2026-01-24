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
import { UserSort, UserWithRelations } from '../db/user';
import {
  GraphQLMetadataProperty,
  GraphQLMetadataPropertyInput,
  GraphQLMetadataPropertyPublic,
  GraphQLPageInfo,
} from './common';
import { Context } from '../context';
import { GraphQLUserRole } from './userRole';
import { GraphQLDateTime } from 'graphql-scalars';
import { Subscription, User } from '@prisma/client';
import {
  GraphQLMemberPlan,
  GraphQLPaymentPeriodicity,
  GraphQLSupportedCurrency,
} from './memberPlan';
import { GraphQLSubscriptionDeactivation } from './subscriptionDeactivation';
import { GraphQLSubscriptionPeriod } from './subscriptionPeriods';
import { GraphQLInvoice } from './invoice';
import { createProxyingResolver } from '../utility';
import { GraphQLImage, GraphQLUploadImageInput } from './image';
import { isMeBySession } from './utils';
import { uniq } from 'ramda';

export const GraphQLUserAddress = new GraphQLObjectType({
  name: 'UserAddress',
  fields: {
    company: { type: GraphQLString },
    streetAddress: { type: GraphQLString },
    streetAddressNumber: { type: GraphQLString },
    streetAddress2: { type: GraphQLString },
    streetAddress2Number: { type: GraphQLString },
    zipCode: { type: GraphQLString },
    city: { type: GraphQLString },
    country: { type: GraphQLString },
  },
});

export const GraphQLPaymentProviderCustomer = new GraphQLObjectType({
  name: 'PaymentProviderCustomer',
  fields: {
    paymentProviderID: { type: new GraphQLNonNull(GraphQLString) },
    customerID: { type: new GraphQLNonNull(GraphQLString) },
  },
});

const GraphQLUserSubscription = new GraphQLObjectType<Subscription, Context>({
  name: 'UserSubscription',
  fields: {
    id: { type: new GraphQLNonNull(GraphQLString) },
    createdAt: { type: new GraphQLNonNull(GraphQLDateTime) },
    modifiedAt: { type: new GraphQLNonNull(GraphQLDateTime) },
    paymentPeriodicity: { type: new GraphQLNonNull(GraphQLPaymentPeriodicity) },
    monthlyAmount: { type: new GraphQLNonNull(GraphQLInt) },
    currency: { type: new GraphQLNonNull(GraphQLSupportedCurrency) },
    autoRenew: { type: new GraphQLNonNull(GraphQLBoolean) },
    confirmed: { type: new GraphQLNonNull(GraphQLBoolean) },
    startsAt: { type: new GraphQLNonNull(GraphQLDateTime) },
    paidUntil: { type: GraphQLDateTime },
    properties: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(GraphQLMetadataProperty))
      ),
    },
    deactivation: { type: GraphQLSubscriptionDeactivation },
    periods: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(GraphQLSubscriptionPeriod))
      ),
    },
    memberPlan: {
      type: new GraphQLNonNull(GraphQLMemberPlan),
      resolve({ memberPlanID }, args, { prisma }) {
        return prisma.memberPlan.findUnique({
          where: {
            id: memberPlanID,
          },
        });
      },
    },
    invoices: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(GraphQLInvoice))
      ),
      resolve({ id: subscriptionId }, args, { prisma }) {
        return prisma.invoice.findMany({
          where: {
            subscriptionID: subscriptionId,
          },
          include: {
            items: true,
          },
        });
      },
    },
  },
});

export const GraphQLUser = new GraphQLObjectType<User, Context>({
  name: 'User',
  fields: {
    id: { type: new GraphQLNonNull(GraphQLString) },

    createdAt: { type: new GraphQLNonNull(GraphQLDateTime) },
    modifiedAt: { type: new GraphQLNonNull(GraphQLDateTime) },

    name: { type: new GraphQLNonNull(GraphQLString) },
    firstName: { type: GraphQLString },
    email: { type: new GraphQLNonNull(GraphQLString) },
    emailVerifiedAt: { type: GraphQLDateTime },
    birthday: { type: GraphQLDateTime },

    address: { type: GraphQLUserAddress },
    flair: { type: GraphQLString },
    note: { type: GraphQLString },

    userImage: {
      type: GraphQLImage,
      resolve: createProxyingResolver(
        ({ userImageID }, _, { prisma: { image } }) =>
          userImageID ?
            image.findUnique({
              where: {
                id: userImageID,
              },
            })
          : null
      ),
    },

    active: { type: new GraphQLNonNull(GraphQLBoolean) },
    lastLogin: { type: GraphQLDateTime },

    properties: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(GraphQLMetadataProperty))
      ),
    },

    roles: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(GraphQLUserRole))
      ),
      resolve({ roleIDs }, args, { loaders }) {
        return Promise.all(
          roleIDs.map(roleID => loaders.userRolesByID.load(roleID))
        );
      },
    },
    paymentProviderCustomers: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(GraphQLPaymentProviderCustomer))
      ),
    },
    subscriptions: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(GraphQLUserSubscription))
      ),
      resolve: createProxyingResolver(({ id: userId }, _, { prisma }) => {
        return prisma.subscription.findMany({
          where: {
            userID: userId,
          },
          include: {
            deactivation: true,
            periods: true,
            properties: true,
          },
        });
      }),
    },
  },
});

export const GraphQLPublicUser = new GraphQLObjectType<
  UserWithRelations,
  Context
>({
  name: 'User',
  fields: {
    id: { type: new GraphQLNonNull(GraphQLString) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    firstName: { type: GraphQLString },
    birthday: {
      type: GraphQLDateTime,
      resolve: createProxyingResolver(({ birthday, id }, _, { session }) =>
        birthday && isMeBySession(id, session) ? birthday : null
      ),
    },
    email: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: createProxyingResolver(({ email, id }, _, { session }) =>
        email && isMeBySession(id, session) ? email : ''
      ),
    },
    address: {
      type: GraphQLUserAddress,
      resolve: createProxyingResolver(({ address, id }, _, { session }) =>
        address && isMeBySession(id, session) ? address : ''
      ),
    },
    flair: { type: GraphQLString },
    paymentProviderCustomers: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(GraphQLPaymentProviderCustomer))
      ),
      resolve: createProxyingResolver(
        ({ id, paymentProviderCustomers }, _, { session }) =>
          id && isMeBySession(id, session) ? paymentProviderCustomers : []
      ),
    },
    image: {
      type: GraphQLImage,
      resolve: createProxyingResolver(
        ({ userImageID }, _, { prisma: { image } }) =>
          userImageID ?
            image.findUnique({
              where: {
                id: userImageID,
              },
            })
          : null
      ),
    },
    properties: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(GraphQLMetadataPropertyPublic))
      ),
      resolve: ({ properties }) =>
        properties
          .filter(property => property.public)
          .map(({ key, value }) => ({ key, value })),
    },
    permissions: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(GraphQLString))
      ),
      resolve: createProxyingResolver(({ id }, _, { session }) => {
        if (!isMeBySession(id, session)) {
          return [];
        }

        return session ?
            uniq(session.roles.flatMap(role => role.permissionIDs))
          : [];
      }),
    },
  },
});

export const GraphQLUserFilter = new GraphQLInputObjectType({
  name: 'UserFilter',
  fields: {
    name: { type: GraphQLString },
    text: { type: GraphQLString },
    userRole: { type: new GraphQLList(GraphQLString) },
  },
});

export const GraphQLUserSort = new GraphQLEnumType({
  name: 'UserSort',
  values: {
    [UserSort.CreatedAt]: { value: UserSort.CreatedAt },
    [UserSort.ModifiedAt]: { value: UserSort.ModifiedAt },
    [UserSort.Name]: { value: UserSort.Name },
    [UserSort.FirstName]: { value: UserSort.FirstName },
  },
});

export const GraphQLUserConnection = new GraphQLObjectType<any, Context>({
  name: 'UserConnection',
  fields: {
    nodes: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(GraphQLUser))
      ),
    },
    pageInfo: { type: new GraphQLNonNull(GraphQLPageInfo) },
    totalCount: { type: new GraphQLNonNull(GraphQLInt) },
  },
});

export const GraphQLUserAddressInput = new GraphQLInputObjectType({
  name: 'UserAddressInput',
  fields: {
    company: { type: GraphQLString },
    streetAddress: { type: GraphQLString },
    streetAddressNumber: { type: GraphQLString },
    streetAddress2: { type: GraphQLString },
    streetAddress2Number: { type: GraphQLString },
    zipCode: { type: GraphQLString },
    city: { type: GraphQLString },
    country: { type: GraphQLString },
  },
});

export const GraphQLUserInput = new GraphQLInputObjectType({
  name: 'UserInput',
  fields: {
    name: { type: new GraphQLNonNull(GraphQLString) },
    firstName: { type: GraphQLString },
    email: { type: new GraphQLNonNull(GraphQLString) },
    emailVerifiedAt: { type: GraphQLDateTime },

    birthday: {
      type: GraphQLDateTime,
    },
    address: { type: GraphQLUserAddressInput },
    flair: { type: GraphQLString },
    note: { type: GraphQLString },

    userImageID: { type: GraphQLString },

    active: { type: new GraphQLNonNull(GraphQLBoolean) },

    properties: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(GraphQLMetadataPropertyInput))
      ),
    },

    roleIDs: { type: new GraphQLList(new GraphQLNonNull(GraphQLString)) },
  },
});

export const GraphQLPublicUserInput = new GraphQLInputObjectType({
  name: 'UserInput',
  fields: {
    name: { type: new GraphQLNonNull(GraphQLString) },
    firstName: { type: GraphQLString },
    email: { type: new GraphQLNonNull(GraphQLString) },
    address: { type: GraphQLUserAddressInput },
    flair: { type: GraphQLString },
    birthday: {
      type: GraphQLDateTime,
    },
    uploadImageInput: { type: GraphQLUploadImageInput },
  },
});

export const GraphQLUserResolver = {
  __resolveReference: async (
    reference: { id: string },
    { loaders }: Context
  ) => {
    const { id } = reference;
    const user = await loaders.usersById.load(id);

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  },
};
