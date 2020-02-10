import {GraphQLObjectType, GraphQLNonNull, GraphQLString} from 'graphql'
import {GraphQLDateTime} from 'graphql-iso-date'

export const GraphQLUser = new GraphQLObjectType({
  name: 'User',
  fields: {
    id: {type: GraphQLNonNull(GraphQLString)},
    email: {type: GraphQLNonNull(GraphQLString)}
  }
})

export const GraphQLSession = new GraphQLObjectType({
  name: 'Session',
  fields: {
    user: {type: GraphQLNonNull(GraphQLUser)},
    token: {type: GraphQLNonNull(GraphQLString)},
    createdAt: {type: GraphQLNonNull(GraphQLDateTime)},
    expiresAt: {type: GraphQLNonNull(GraphQLDateTime)}
  }
})
