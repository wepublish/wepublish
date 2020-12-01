import {Context} from '../context'
import {
  GraphQLID,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLList,
  GraphQLInt,
  GraphQLInputObjectType,
  GraphQLEnumType,
  GraphQLBoolean
} from 'graphql'
import {GraphQLDateTime} from 'graphql-iso-date'
import {createProxyingResolver} from '../utility'
import {GraphQLPageInfo} from './common'
import {Payment, PaymentSort} from '../db/payment'
import {GraphQLInvoice} from './invoice'
import {GraphQLPaymentMethod} from './paymentMethod'

export const GraphQLPayment = new GraphQLObjectType<Payment, Context>({
  name: 'Payment',
  fields: {
    id: {type: GraphQLNonNull(GraphQLID)},

    createdAt: {type: GraphQLNonNull(GraphQLDateTime)},
    modifiedAt: {type: GraphQLNonNull(GraphQLDateTime)},

    intentID: {type: GraphQLNonNull(GraphQLString)},
    amount: {type: GraphQLNonNull(GraphQLInt)},
    invoice: {
      type: GraphQLInvoice,
      resolve: createProxyingResolver(({invoiceID}, {}, {loaders}) => {
        if (invoiceID) return loaders.invoicesByID.load(invoiceID)
        return null
      })
    },
    intentData: {
      type: GraphQLString,
      resolve: createProxyingResolver(({intentData}) => {
        return JSON.stringify(intentData)
      })
    },
    open: {type: GraphQLNonNull(GraphQLBoolean)},
    successful: {type: GraphQLNonNull(GraphQLBoolean)},
    paymentMethod: {
      type: GraphQLNonNull(GraphQLPaymentMethod),
      resolve: createProxyingResolver(({paymentMethodID}, {}, {loaders}) => {
        return loaders.paymentMethodsByID.load(paymentMethodID)
      })
    },
    paymentData: {
      type: GraphQLString,
      resolve: createProxyingResolver(({paymentData}) => {
        return JSON.stringify(paymentData)
      })
    }
  }
})

export const GraphQLPaymentFilter = new GraphQLInputObjectType({
  name: 'PaymentFilter',
  fields: {
    intentID: {type: GraphQLString}
  }
})

export const GraphQLPaymentSort = new GraphQLEnumType({
  name: 'PaymentSort',
  values: {
    CREATED_AT: {value: PaymentSort.CreatedAt},
    MODIFIED_AT: {value: PaymentSort.ModifiedAt}
  }
})

export const GraphQLPaymentConnection = new GraphQLObjectType<any, Context>({
  name: 'PaymentConnection',
  fields: {
    nodes: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLPayment)))},
    pageInfo: {type: GraphQLNonNull(GraphQLPageInfo)},
    totalCount: {type: GraphQLNonNull(GraphQLInt)}
  }
})
