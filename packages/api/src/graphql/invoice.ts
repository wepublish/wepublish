import {Invoice, InvoiceHistory, InvoiceItem, InvoiceSort} from '../db/invoice'
import {Context} from '../context'
import {
  GraphQLID,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLBoolean,
  GraphQLList,
  GraphQLInt,
  GraphQLInputObjectType,
  GraphQLEnumType
} from 'graphql'
import {GraphQLDateTime} from 'graphql-iso-date'
import {GraphQLUser} from './user'
import {createProxyingResolver} from '../utility'
import {GraphQLRichText} from './richText'
import {GraphQLPaymentMethod} from './paymentMethod'
import {GraphQLPageInfo} from './common'

export const GraphQLInvoiceHistory = new GraphQLObjectType<InvoiceHistory, Context>({
  name: 'InvoiceHistory',
  fields: {
    createdAt: {type: GraphQLNonNull(GraphQLDateTime)},
    successful: {type: GraphQLNonNull(GraphQLBoolean)},
    paymentMethod: {
      type: GraphQLNonNull(GraphQLPaymentMethod),
      resolve: createProxyingResolver(({paymentMethodID}, {}, {loaders}) => {
        return loaders.paymentMethodsByID.load(paymentMethodID)
      })
    },
    paymentTransaction: {type: GraphQLNonNull(GraphQLString)}
  }
})

export const GraphQLInvoiceItem = new GraphQLObjectType<InvoiceItem, Context>({
  name: 'InvoiceItem',
  fields: {
    createdAt: {type: GraphQLNonNull(GraphQLDateTime)},
    modifiedAt: {type: GraphQLNonNull(GraphQLDateTime)},
    name: {type: GraphQLNonNull(GraphQLString)},
    description: {type: GraphQLRichText},
    quantity: {type: GraphQLNonNull(GraphQLInt)},
    amount: {type: GraphQLNonNull(GraphQLInt)},
    total: {
      type: GraphQLNonNull(GraphQLInt),
      resolve: createProxyingResolver(({amount, quantity}) => {
        return amount * quantity
      })
    }
  }
})

export const GraphQLInvoice = new GraphQLObjectType<Invoice, Context>({
  name: 'Invoice',
  fields: {
    id: {type: GraphQLNonNull(GraphQLID)},

    createdAt: {type: GraphQLNonNull(GraphQLDateTime)},
    modifiedAt: {type: GraphQLNonNull(GraphQLDateTime)},

    mail: {type: GraphQLNonNull(GraphQLString)},
    user: {
      type: GraphQLUser,
      resolve: createProxyingResolver(({userID}, {}, {dbAdapter}) => {
        return userID ? dbAdapter.user.getUserByID(userID) : undefined
      })
    },
    description: {type: GraphQLRichText},
    payedAt: {type: GraphQLDateTime},
    history: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLInvoiceHistory)))},
    items: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLInvoiceItem)))},
    total: {
      type: GraphQLNonNull(GraphQLInt),
      resolve: createProxyingResolver(({items}) => {
        return items.reduce((previousValue, currentValue) => {
          return previousValue + currentValue.quantity * currentValue.amount
        }, 0)
      })
    }
  }
})

export const GraphQLinvoiceFilter = new GraphQLInputObjectType({
  name: 'InvoiceFilter',
  fields: {
    name: {type: GraphQLString}
  }
})

export const GraphQLInvoiceSort = new GraphQLEnumType({
  name: 'InvoiceSort',
  values: {
    CREATED_AT: {value: InvoiceSort.CreatedAt},
    MODIFIED_AT: {value: InvoiceSort.ModifiedAt},
    PAYED_AT: {value: InvoiceSort.PayedAt}
  }
})

export const GraphQLInvoiceConnection = new GraphQLObjectType<any, Context>({
  name: 'InvoiceConnection',
  fields: {
    nodes: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLInvoice)))},
    pageInfo: {type: GraphQLNonNull(GraphQLPageInfo)},
    totalCount: {type: GraphQLNonNull(GraphQLInt)}
  }
})

export const GraphQLInvoiceItemInput = new GraphQLInputObjectType({
  name: 'InvoiceItemInput',
  fields: {
    name: {type: GraphQLNonNull(GraphQLString)},
    description: {type: GraphQLRichText},
    quantity: {type: GraphQLNonNull(GraphQLInt)},
    amount: {type: GraphQLNonNull(GraphQLInt)}
  }
})

export const GraphQLInvoiceInput = new GraphQLInputObjectType({
  name: 'InvoiceInput',
  fields: {
    mail: {type: GraphQLNonNull(GraphQLString)},
    userID: {type: GraphQLID},
    description: {type: GraphQLRichText},
    payedAt: {type: GraphQLDateTime},
    items: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLInvoiceItemInput)))}
  }
})
