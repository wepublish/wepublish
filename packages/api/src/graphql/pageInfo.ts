import {GraphQLObjectType, GraphQLNonNull, GraphQLInt} from 'graphql'

export const GraphQLPageInfo = new GraphQLObjectType({
  name: 'PageInfo',
  fields: {
    total: {type: GraphQLNonNull(GraphQLInt)},
    offset: {type: GraphQLNonNull(GraphQLInt)},
    limit: {type: GraphQLNonNull(GraphQLInt)}
  }
})
