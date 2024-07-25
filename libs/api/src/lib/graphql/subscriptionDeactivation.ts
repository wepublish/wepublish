import {SubscriptionDeactivationReason} from '@prisma/client'
import {GraphQLEnumType, GraphQLNonNull, GraphQLObjectType} from 'graphql'
import {GraphQLDateTime} from 'graphql-scalars'

export const GraphQLSubscriptionDeactivationReason = new GraphQLEnumType({
  name: 'SubscriptionDeactivationReason',
  values: {
    none: {value: SubscriptionDeactivationReason.none},
    userSelfDeactivated: {value: SubscriptionDeactivationReason.userSelfDeactivated},
    invoiceNotPaid: {value: SubscriptionDeactivationReason.invoiceNotPaid}
  }
})

export const GraphQLSubscriptionDeactivation = new GraphQLObjectType({
  name: 'SubscriptionDeactivation',
  fields: {
    date: {type: new GraphQLNonNull(GraphQLDateTime)},
    reason: {type: new GraphQLNonNull(GraphQLSubscriptionDeactivationReason)}
  }
})
