import {GraphQLObjectType, GraphQLString, GraphQLBoolean} from 'graphql'

export const GraphQLPageInfo = new GraphQLObjectType({
  name: 'PageInfo',
  fields: {
    startCursor: {type: GraphQLString},
    endCursor: {type: GraphQLString},
    hasNextPage: {type: GraphQLBoolean},
    hasPreviousPage: {type: GraphQLBoolean}
  }
})
