import {GraphQLObjectType, GraphQLNonNull, GraphQLInputObjectType} from 'graphql'
import {GraphQLDateTime} from 'graphql-iso-date'

export const GraphQLDateRange = new GraphQLObjectType({
  name: 'DateRange',
  description: 'A date range. Note that `start` is exclusive.',
  fields: {
    start: {type: GraphQLNonNull(GraphQLDateTime)},
    end: {type: GraphQLNonNull(GraphQLDateTime)}
  }
})

export const GraphQLDateRangeInput = new GraphQLInputObjectType({
  name: 'DateRangeInput',
  description: 'A date range input. Note that `start` is exclusive.',
  fields: {
    start: {type: GraphQLNonNull(GraphQLDateTime)},
    end: {type: GraphQLNonNull(GraphQLDateTime)}
  }
})
