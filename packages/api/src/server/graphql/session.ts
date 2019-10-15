import {GraphQLObjectType, GraphQLNonNull, GraphQLString, GraphQLInt} from 'graphql'
import {GraphQLDateTime} from 'graphql-iso-date'

export const GraphQLUser = new GraphQLObjectType({
  name: 'User',
  fields: {
    email: {type: GraphQLNonNull(GraphQLString)}
  }
})

export const GraphQLCredentialAuthResponse = new GraphQLObjectType({
  name: 'CredentialAuthResponse',
  fields: {
    user: {type: GraphQLNonNull(GraphQLUser)},
    refreshToken: {type: GraphQLNonNull(GraphQLString)},
    accessToken: {type: GraphQLNonNull(GraphQLString)},
    refreshTokenExpiresIn: {type: GraphQLNonNull(GraphQLInt)},
    accessTokenExpiresIn: {type: GraphQLNonNull(GraphQLInt)}
  }
})

export const GraphQLTokenAuthResponse = new GraphQLObjectType({
  name: 'TokenAuthResponse',
  fields: {
    user: {type: GraphQLNonNull(GraphQLUser)},
    accessToken: {type: GraphQLNonNull(GraphQLString)},
    accessTokenExpiresIn: {type: GraphQLNonNull(GraphQLInt)}
  }
})

export const GraphQLPeerSession = new GraphQLObjectType({
  name: 'UserSession',
  fields: {
    token: {type: GraphQLNonNull(GraphQLString)}
  }
})
