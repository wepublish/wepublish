import {
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLBoolean,
  GraphQLInputObjectType,
  GraphQLInt,
} from 'graphql';
import { Context } from '../context';
import { GraphQLDateTime } from 'graphql-scalars';
import { PaymentProvider } from '@wepublish/payment/api';
import { createProxyingResolver } from '../utility';
import { GraphQLSlug } from '@wepublish/utils/api';
import { PaymentMethod } from '@prisma/client';
import { GraphQLImage } from './image';

export const GraphQLPaymentProvider = new GraphQLObjectType<
  PaymentProvider,
  Context
>({
  name: 'PaymentProvider',
  fields: {
    id: { type: new GraphQLNonNull(GraphQLString) },
    name: { type: new GraphQLNonNull(GraphQLString) },
  },
});

export const GraphQLPaymentMethod = new GraphQLObjectType<
  PaymentMethod,
  Context
>({
  name: 'PaymentMethod',
  fields: {
    id: { type: new GraphQLNonNull(GraphQLString) },

    createdAt: { type: new GraphQLNonNull(GraphQLDateTime) },
    modifiedAt: { type: new GraphQLNonNull(GraphQLDateTime) },

    name: { type: new GraphQLNonNull(GraphQLString) },
    slug: { type: new GraphQLNonNull(GraphQLSlug) },
    description: { type: new GraphQLNonNull(GraphQLString) },
    paymentProvider: {
      type: GraphQLPaymentProvider,
      resolve: createProxyingResolver(
        ({ paymentProviderID }, _, { paymentProviders }) => {
          return paymentProviders.find(
            paymentProvider => paymentProvider.id === paymentProviderID
          );
        }
      ),
    },
    active: { type: new GraphQLNonNull(GraphQLBoolean) },
    gracePeriod: { type: new GraphQLNonNull(GraphQLInt) },
    imageId: {
      type: GraphQLString,
    },
    image: {
      type: GraphQLImage,
      resolve: createProxyingResolver(({ imageId }, args, { loaders }) => {
        return imageId ? loaders.images.load(imageId) : null;
      }),
    },
  },
});

export const GraphQLPublicPaymentMethod = new GraphQLObjectType<
  PaymentMethod,
  Context
>({
  name: 'PaymentMethod',
  fields: {
    id: { type: new GraphQLNonNull(GraphQLString) },
    paymentProviderID: { type: new GraphQLNonNull(GraphQLString) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    slug: { type: new GraphQLNonNull(GraphQLSlug) },
    description: { type: new GraphQLNonNull(GraphQLString) },
    imageId: {
      type: GraphQLString,
    },
    image: {
      type: GraphQLImage,
      resolve: createProxyingResolver(({ imageId }, args, { loaders }) => {
        return imageId ? loaders.images.load(imageId) : null;
      }),
    },
  },
});

export const GraphQLPaymentMethodInput = new GraphQLInputObjectType({
  name: 'PaymentMethodInput',
  fields: {
    name: { type: new GraphQLNonNull(GraphQLString) },
    slug: { type: new GraphQLNonNull(GraphQLSlug) },
    description: { type: new GraphQLNonNull(GraphQLString) },
    paymentProviderID: { type: new GraphQLNonNull(GraphQLString) },
    active: { type: new GraphQLNonNull(GraphQLBoolean) },
    gracePeriod: { type: new GraphQLNonNull(GraphQLInt) },
    imageId: {
      type: GraphQLString,
    },
  },
});
