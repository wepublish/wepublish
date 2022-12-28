import {InvoiceItem} from '@prisma/client'
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
import {GraphQLDate, GraphQLDateTime} from 'graphql-scalars'
import {Context} from '../context'
import {InvoiceSort, InvoiceWithItems} from '../db/invoice'
import {createProxyingResolver} from '../utility'
import {GraphQLPageInfo} from './common'

export const GraphQLInvoiceItem = new GraphQLObjectType<InvoiceItem, Context>({
  name: 'InvoiceItem',
  fields: {
    createdAt: {type: GraphQLNonNull(GraphQLDateTime)},
    modifiedAt: {type: GraphQLNonNull(GraphQLDateTime)},
    name: {type: GraphQLNonNull(GraphQLString)},
    description: {type: GraphQLString},
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

export const GraphQLInvoice = new GraphQLObjectType<InvoiceWithItems, Context>({
  name: 'Invoice',
  fields: {
    id: {type: GraphQLNonNull(GraphQLID)},

    createdAt: {type: GraphQLNonNull(GraphQLDateTime)},
    modifiedAt: {type: GraphQLNonNull(GraphQLDateTime)},

    mail: {type: GraphQLNonNull(GraphQLString)},
    description: {type: GraphQLString},
    paidAt: {type: GraphQLDateTime},
    manuallySetAsPaidByUserId: {type: GraphQLID},
    items: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLInvoiceItem)))},
    canceledAt: {type: GraphQLDateTime},
    total: {
      type: GraphQLNonNull(GraphQLInt),
      resolve: createProxyingResolver(({items}) => {
        return (items || []).reduce((previousValue, currentValue) => {
          return previousValue + currentValue.quantity * currentValue.amount
        }, 0)
      })
    }
  }
})

export const GraphQLPublicInvoice = new GraphQLObjectType<InvoiceWithItems, Context>({
  name: 'Invoice',
  fields: {
    id: {type: GraphQLNonNull(GraphQLID)},

    createdAt: {type: GraphQLNonNull(GraphQLDateTime)},
    modifiedAt: {type: GraphQLNonNull(GraphQLDateTime)},

    mail: {type: GraphQLNonNull(GraphQLString)},

    description: {type: GraphQLString},
    paidAt: {type: GraphQLDateTime},
    canceledAt: {type: GraphQLDateTime},
    items: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLInvoiceItem)))},
    subscriptionID: {type: GraphQLNonNull(GraphQLID)},
    total: {
      type: GraphQLNonNull(GraphQLInt),
      resolve: createProxyingResolver(({items}) => {
        return (items || []).reduce((previousValue, currentValue) => {
          return previousValue + currentValue.quantity * currentValue.amount
        }, 0)
      })
    }
  }
})

export const GraphQLinvoiceFilter = new GraphQLInputObjectType({
  name: 'InvoiceFilter',
  fields: {
    mail: {type: GraphQLString},
    paidAt: {type: GraphQLDate},
    canceledAt: {type: GraphQLDate},
    userID: {type: GraphQLID},
    subscriptionID: {type: GraphQLID}
  }
})

export const GraphQLInvoiceSort = new GraphQLEnumType({
  name: 'InvoiceSort',
  values: {
    CREATED_AT: {value: InvoiceSort.CreatedAt},
    MODIFIED_AT: {value: InvoiceSort.ModifiedAt},
    PAID_AT: {value: InvoiceSort.PaidAt}
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
    description: {type: GraphQLString},
    quantity: {type: GraphQLNonNull(GraphQLInt)},
    amount: {type: GraphQLNonNull(GraphQLInt)},
    createdAt: {type: GraphQLNonNull(GraphQLDateTime)},
    modifiedAt: {type: GraphQLNonNull(GraphQLDateTime)}
  }
})

export const GraphQLInvoiceInput = new GraphQLInputObjectType({
  name: 'InvoiceInput',
  fields: {
    mail: {type: GraphQLNonNull(GraphQLString)},
    description: {type: GraphQLString},
    paidAt: {type: GraphQLDateTime},
    subscriptionID: {type: GraphQLID},
    manuallySetAsPaidByUserId: {type: GraphQLID},
    items: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLInvoiceItemInput)))}
  }
})
