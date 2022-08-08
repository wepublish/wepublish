import {GraphQLEnumType, GraphQLNonNull, GraphQLObjectType} from 'graphql'
import {SubscriptionDeactivationReason} from '../db/subscription'
import {GraphQLDateTime} from 'graphql-iso-date'

export const GraphQLSubscriptionDeactivationReason = new GraphQLEnumType({
  name: 'SubscriptionDeactivationReason',
  values: {
    NONE: {value: SubscriptionDeactivationReason.None},
    USER_SELF_DEACTIVATED: {value: SubscriptionDeactivationReason.UserSelfDeactivated},
    INVOICE_NOT_PAID: {value: SubscriptionDeactivationReason.InvoiceNotPaid}
  }
})

export const GraphQLSubscriptionDeactivation = new GraphQLObjectType({
  name: 'SubscriptionDeactivation',
  fields: {
    date: {type: GraphQLNonNull(GraphQLDateTime)},
    reason: {type: GraphQLNonNull(GraphQLSubscriptionDeactivationReason)}
  }
})
