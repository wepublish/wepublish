import {GraphQLNonNull, GraphQLObjectType, GraphQLString} from 'graphql'

export const GraphQLAuthProvider = new GraphQLObjectType({
  name: 'AuthProvider',
  fields: {
    name: {type: GraphQLNonNull(GraphQLString)},
    url: {type: GraphQLNonNull(GraphQLString)}
  }
})
