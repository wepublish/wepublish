import {GraphQLNonNull, GraphQLObjectType, GraphQLString} from 'graphql'

export const GraphQLAuthProvider = new GraphQLObjectType({
  name: 'AuthProvider',
  fields: {
    name: {type: new GraphQLNonNull(GraphQLString)},
    url: {type: new GraphQLNonNull(GraphQLString)}
  }
})

export const GraphQLJWTToken = new GraphQLObjectType({
  name: 'JWTToken',
  fields: {
    token: {type: new GraphQLNonNull(GraphQLString)},
    expiresAt: {type: new GraphQLNonNull(GraphQLString)}
  }
})
