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
import {GraphQLRichText} from './richText'
import {GraphQLDateTime} from 'graphql-iso-date'

export const GraphQLPaymentMethod = new GraphQLObjectType<PaymentMethod, Context>({
  name: 'PaymentMethod',
  fields: {
    id: {type: GraphQLNonNull(GraphQLID)},

    createdAt: {type: GraphQLNonNull(GraphQLDateTime)},
    modifiedAt: {type: GraphQLNonNull(GraphQLDateTime)},

    name: {type: GraphQLNonNull(GraphQLString)},
    description: {type: GraphQLNonNull(GraphQLRichText)},
    paymentAdapter: {type: GraphQLNonNull(GraphQLString)},
    active: {type: GraphQLNonNull(GraphQLBoolean)}
  }
})

export const GraphQLPaymentMethodInput = new GraphQLInputObjectType({
  name: 'PaymentMethodInput',
  fields: {
    name: {type: GraphQLNonNull(GraphQLString)},
    description: {type: GraphQLNonNull(GraphQLRichText)},
    paymentAdapter: {type: GraphQLNonNull(GraphQLString)},
    active: {type: GraphQLNonNull(GraphQLBoolean)}
  }
})
