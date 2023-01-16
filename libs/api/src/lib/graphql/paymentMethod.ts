import {
  GraphQLID,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLBoolean,
  GraphQLInputObjectType
} from 'graphql'
import {Context} from '../context'
import {GraphQLDateTime} from 'graphql-scalars'
import {PaymentProvider} from '../payments/paymentProvider'
import {createProxyingResolver} from '../utility'
import {GraphQLSlug} from './slug'
import {PaymentMethod} from '@prisma/client'

export const GraphQLPaymentProvider = new GraphQLObjectType<PaymentProvider, Context>({
  name: 'PaymentProvider',
  fields: {
    id: {type: GraphQLNonNull(GraphQLID)},
    name: {type: GraphQLNonNull(GraphQLString)}
  }
})

export const GraphQLPaymentMethod = new GraphQLObjectType<PaymentMethod, Context>({
  name: 'PaymentMethod',
  fields: {
    id: {type: GraphQLNonNull(GraphQLID)},

    createdAt: {type: GraphQLNonNull(GraphQLDateTime)},
    modifiedAt: {type: GraphQLNonNull(GraphQLDateTime)},

    name: {type: GraphQLNonNull(GraphQLString)},
    slug: {type: GraphQLNonNull(GraphQLSlug)},
    description: {type: GraphQLNonNull(GraphQLString)},
    paymentProvider: {
      type: GraphQLNonNull(GraphQLPaymentProvider),
      resolve: createProxyingResolver(({paymentProviderID}, _, {paymentProviders}) => {
        return paymentProviders.find(paymentProvider => paymentProvider.id === paymentProviderID)
      })
    },
    active: {type: GraphQLNonNull(GraphQLBoolean)}
  }
})

export const GraphQLPublicPaymentMethod = new GraphQLObjectType<PaymentMethod, Context>({
  name: 'PaymentMethod',
  fields: {
    id: {type: GraphQLNonNull(GraphQLID)},
    paymentProviderID: {type: GraphQLNonNull(GraphQLString)},
    name: {type: GraphQLNonNull(GraphQLString)},
    slug: {type: GraphQLNonNull(GraphQLSlug)},
    description: {type: GraphQLNonNull(GraphQLString)}
  }
})

export const GraphQLPaymentMethodInput = new GraphQLInputObjectType({
  name: 'PaymentMethodInput',
  fields: {
    name: {type: GraphQLNonNull(GraphQLString)},
    slug: {type: GraphQLNonNull(GraphQLSlug)},
    description: {type: GraphQLNonNull(GraphQLString)},
    paymentProviderID: {type: GraphQLNonNull(GraphQLString)},
    active: {type: GraphQLNonNull(GraphQLBoolean)}
  }
})
