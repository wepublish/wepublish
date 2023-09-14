import {GraphQLID, GraphQLInt, GraphQLNonNull, GraphQLObjectType} from 'graphql'
import {GraphQLDateTime} from 'graphql-scalars'
import {GraphQLPaymentPeriodicity} from './memberPlan'

export const GraphQLSubscriptionPeriod = new GraphQLObjectType({
  name: 'SubscriptionPeriod',
  fields: {
    id: {type: new GraphQLNonNull(GraphQLID)},
    invoiceID: {type: new GraphQLNonNull(GraphQLID)},
    amount: {type: new GraphQLNonNull(GraphQLInt)},
    createdAt: {type: new GraphQLNonNull(GraphQLDateTime)},
    startsAt: {type: new GraphQLNonNull(GraphQLDateTime)},
    endsAt: {type: new GraphQLNonNull(GraphQLDateTime)},
    paymentPeriodicity: {type: new GraphQLNonNull(GraphQLPaymentPeriodicity)}
  }
})
