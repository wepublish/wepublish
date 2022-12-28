import {GraphQLID, GraphQLInt, GraphQLNonNull, GraphQLObjectType} from 'graphql'
import {GraphQLDateTime} from 'graphql-scalars'
import {GraphQLPaymentPeriodicity} from './memberPlan'

export const GraphQLSubscriptionPeriod = new GraphQLObjectType({
  name: 'SubscriptionPeriod',
  fields: {
    id: {type: GraphQLNonNull(GraphQLID)},
    invoiceID: {type: GraphQLNonNull(GraphQLID)},
    amount: {type: GraphQLNonNull(GraphQLInt)},
    createdAt: {type: GraphQLNonNull(GraphQLDateTime)},
    startsAt: {type: GraphQLNonNull(GraphQLDateTime)},
    endsAt: {type: GraphQLNonNull(GraphQLDateTime)},
    paymentPeriodicity: {type: GraphQLNonNull(GraphQLPaymentPeriodicity)}
  }
})
