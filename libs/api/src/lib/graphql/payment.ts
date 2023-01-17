import {Payment, PaymentState} from '@prisma/client'
import {
  GraphQLEnumType,
  GraphQLID,
  GraphQLInputObjectType,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString
} from 'graphql'
import {GraphQLDateTime} from 'graphql-scalars'
import {Context} from '../context'
import {PaymentSort} from '../db/payment'
import {createProxyingResolver} from '../utility'
import {GraphQLPageInfo} from './common'
import {GraphQLInvoice} from './invoice'
import {GraphQLPaymentMethod, GraphQLPublicPaymentMethod} from './paymentMethod'
import {GraphQLSlug} from './slug'

export const GraphQLPaymentState = new GraphQLEnumType({
  name: 'PaymentState',
  values: {
    Created: {value: PaymentState.created},
    Submitted: {value: PaymentState.submitted},
    RequiresUserAction: {value: PaymentState.requiresUserAction},
    Processing: {value: PaymentState.processing},
    Paid: {value: PaymentState.paid},
    Canceled: {value: PaymentState.canceled},
    Declined: {value: PaymentState.declined}
  }
})

export const GraphQLPublicPayment = new GraphQLObjectType<Payment, Context>({
  name: 'Payment',
  fields: {
    id: {type: GraphQLNonNull(GraphQLID)},

    intentSecret: {type: GraphQLString},
    state: {type: GraphQLNonNull(GraphQLPaymentState)},

    paymentMethod: {
      type: GraphQLNonNull(GraphQLPublicPaymentMethod),
      resolve: createProxyingResolver(({paymentMethodID}, _, {loaders}) => {
        return loaders.paymentMethodsByID.load(paymentMethodID)
      })
    }
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
      resolve: createProxyingResolver(({invoiceID}, _, {loaders}) => {
        return loaders.invoicesByID.load(invoiceID)
      })
    },
    intentData: {type: GraphQLString},
    paymentMethod: {
      type: GraphQLNonNull(GraphQLPaymentMethod),
      resolve: createProxyingResolver(({paymentMethodID}, _, {loaders}) => {
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
    paymentMethodID: {type: GraphQLID},
    paymentMethodSlug: {type: GraphQLSlug},
    successURL: {type: GraphQLString},
    failureURL: {type: GraphQLString}
  }
})
