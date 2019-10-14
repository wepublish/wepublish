import {GraphQLObjectType, GraphQLNonNull, GraphQLString, GraphQLInt} from 'graphql'
import {GraphQLDateTime} from 'graphql-iso-date'

export const GraphQLUser = new GraphQLObjectType({
  name: 'User',
  fields: {
    email: {type: GraphQLNonNull(GraphQLString)}
  }
})

export const GraphQLUserSession = new GraphQLObjectType({
  name: 'UserSession',
  fields: {
    user: {type: GraphQLNonNull(GraphQLUser)},
    refreshToken: {type: GraphQLNonNull(GraphQLString)},
    accessToken: {type: GraphQLNonNull(GraphQLString)},
    refreshTokenExpiresIn: {type: GraphQLNonNull(GraphQLInt)},
    accessTokenExpiresIn: {type: GraphQLNonNull(GraphQLInt)}
  }
})

export const GraphQLPeerSession = new GraphQLObjectType({
  name: 'UserSession',
  fields: {
    token: {type: GraphQLNonNull(GraphQLString)}
  }
})
