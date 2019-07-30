import {GraphQLObjectType, GraphQLNonNull, GraphQLInputObjectType} from 'graphql'
import {GraphQLDateTime} from 'graphql-iso-date'

export const GraphQLDateRange = new GraphQLObjectType({
  name: 'DateRange',
  fields: {
    start: {type: GraphQLNonNull(GraphQLDateTime)},
    end: {type: GraphQLNonNull(GraphQLDateTime)}
  }
})

export const GraphQLDateRangeInput = new GraphQLInputObjectType({
  name: 'DateRangeInput',
  fields: {
    start: {type: GraphQLDateTime},
    end: {type: GraphQLNonNull(GraphQLDateTime)}
  }
})
