import {Context} from '../context'
import {
  GraphQLID,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLList,
  GraphQLInt,
  GraphQLInputObjectType,
  GraphQLEnumType
} from 'graphql'
import {GraphQLDateTime} from 'graphql-iso-date'
import {createProxyingResolver} from '../utility'
import {GraphQLPageInfo} from './common'
import {Payment, PaymentSort, PaymentState} from '../db/payment'
import {GraphQLInvoice} from './invoice'
import {GraphQLPaymentMethod} from './paymentMethod'

export const GraphQLPaymentState = new GraphQLEnumType({
  name: 'PaymentState',
  values: {
    Created: {value: PaymentState.Created},
    Submitted: {value: PaymentState.Submitted},
    RequiresUserAction: {value: PaymentState.RequiresUserAction},
    Processing: {value: PaymentState.Processing},
    Payed: {value: PaymentState.Paid},
    Canceled: {value: PaymentState.Canceled},
    Declined: {value: PaymentState.Declined}
  }
})

export const GraphQLPayment = new GraphQLObjectType<Payment, Context>({
  name: 'Payment',
  fields: {
    id: {type: GraphQLNonNull(GraphQLID)},

    createdAt: {type: GraphQLNonNull(GraphQLDateTime)},
    modifiedAt: {type: GraphQLNonNull(GraphQLDateTime)},

    intentID: {type: GraphQLString},
    intentSecret: {type: GraphQLString},
    state: {type: GraphQLNonNull(GraphQLPaymentState)},
    invoice: {
      type: GraphQLNonNull(GraphQLInvoice),
      resolve: createProxyingResolver(({invoiceID}, {}, {loaders}) => {
        return loaders.invoicesByID.load(invoiceID)
      })
    },
    intentData: {type: GraphQLString},
    paymentMethod: {
      type: GraphQLNonNull(GraphQLPaymentMethod),
      resolve: createProxyingResolver(({paymentMethodID}, {}, {loaders}) => {
        return loaders.paymentMethodsByID.load(paymentMethodID)
      })
    },
    paymentData: {type: GraphQLString}
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

export const GraphQLPaymentFromInvoiceInput = new GraphQLInputObjectType({
  name: 'PaymentFromInvoiceInput',
  fields: {
    invoiceID: {type: GraphQLNonNull(GraphQLString)},
    paymentMethodID: {type: GraphQLNonNull(GraphQLString)},
    successURL: {type: GraphQLString},
    failureURL: {type: GraphQLString}
  }
})
