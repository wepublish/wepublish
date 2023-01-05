import {SubscriptionDeactivationReason} from '@prisma/client'
import {GraphQLEnumType, GraphQLNonNull, GraphQLObjectType} from 'graphql'
import {GraphQLDateTime} from 'graphql-scalars'

export const GraphQLSubscriptionDeactivationReason = new GraphQLEnumType({
  name: 'SubscriptionDeactivationReason',
  values: {
    NONE: {value: SubscriptionDeactivationReason.none},
    USER_SELF_DEACTIVATED: {value: SubscriptionDeactivationReason.userSelfDeactivated},
    INVOICE_NOT_PAID: {value: SubscriptionDeactivationReason.invoiceNotPaid}
  }
})

export const GraphQLSubscriptionDeactivation = new GraphQLObjectType({
  name: 'SubscriptionDeactivation',
  fields: {
    date: {type: GraphQLNonNull(GraphQLDateTime)},
    reason: {type: GraphQLNonNull(GraphQLSubscriptionDeactivationReason)}
  }
})
