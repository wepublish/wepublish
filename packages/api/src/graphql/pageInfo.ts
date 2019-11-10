import {GraphQLObjectType, GraphQLNonNull, GraphQLString, GraphQLBoolean} from 'graphql'

export const GraphQLPageInfo = new GraphQLObjectType({
  name: 'PageInfo',
  fields: {
    startCursor: {type: GraphQLString},
    endCursor: {type: GraphQLString},
    hasNextPage: {type: GraphQLNonNull(GraphQLBoolean)},
    hasPreviousPage: {type: GraphQLNonNull(GraphQLBoolean)}
  }
})
