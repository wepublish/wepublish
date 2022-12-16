import {GraphQLNonNull, GraphQLObjectType, GraphQLString} from 'graphql'
export const GraphQLAuthProvider = new GraphQLObjectType({
  name: 'AuthProvider',
  fields: {
    name: {type: GraphQLNonNull(GraphQLString)},
    url: {type: GraphQLNonNull(GraphQLString)}
  }
})

export const GraphQLJWTToken = new GraphQLObjectType({
  name: 'JWTToken',
  fields: {
    token: {type: GraphQLNonNull(GraphQLString)},
    expiresAt: {type: GraphQLNonNull(GraphQLString)}
  }
})
