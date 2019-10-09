import {GraphQLObjectType, GraphQLNonNull, GraphQLString} from 'graphql'

export const GraphQLUserSession = new GraphQLObjectType({
  name: 'UserSession',
  fields: {
    username: {type: GraphQLNonNull(GraphQLString)},
    token: {type: GraphQLNonNull(GraphQLString)}
  }
})

export const GraphQLPeerSession = new GraphQLObjectType({
  name: 'UserSession',
  fields: {
    token: {type: GraphQLNonNull(GraphQLString)}
  }
})
