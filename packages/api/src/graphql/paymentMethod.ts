import {
  GraphQLID,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLBoolean,
  GraphQLInputObjectType
} from 'graphql'
import {PaymentMethod} from '../db/paymentMethod'
import {Context} from '../context'
import {GraphQLDateTime} from 'graphql-iso-date'
import {PaymentProvider} from '../payments/paymentProvider'
import {createProxyingResolver} from '../utility'

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
    description: {type: GraphQLNonNull(GraphQLString)},
    paymentProvider: {
      type: GraphQLNonNull(GraphQLPaymentProvider),
      resolve: createProxyingResolver(({paymentProviderID}, {}, {paymentProviders}) => {
        return paymentProviders.find(paymentProvider => paymentProvider.id === paymentProviderID)
      })
    },
    active: {type: GraphQLNonNull(GraphQLBoolean)}
  }
})

export const GraphQLPaymentMethodInput = new GraphQLInputObjectType({
  name: 'PaymentMethodInput',
  fields: {
    name: {type: GraphQLNonNull(GraphQLString)},
    description: {type: GraphQLNonNull(GraphQLString)},
    paymentProviderID: {type: GraphQLNonNull(GraphQLString)},
    active: {type: GraphQLNonNull(GraphQLBoolean)}
  }
})
