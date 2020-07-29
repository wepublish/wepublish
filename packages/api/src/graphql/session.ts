import {GraphQLObjectType, GraphQLNonNull, GraphQLString, GraphQLID} from 'graphql'
import {GraphQLDateTime} from 'graphql-iso-date'
import {GraphQLUser} from './user'

export const GraphQLSessionWithToken = new GraphQLObjectType({
  name: 'SessionWithToken',
  fields: {
    id: {type: GraphQLNonNull(GraphQLID)},
    user: {type: GraphQLNonNull(GraphQLUser)},
    token: {type: GraphQLNonNull(GraphQLString)},
    createdAt: {type: GraphQLNonNull(GraphQLDateTime)},
    expiresAt: {type: GraphQLNonNull(GraphQLDateTime)}
  }
})

export const GraphQLSession = new GraphQLObjectType({
  name: 'Session',
  fields: {
    id: {type: GraphQLNonNull(GraphQLID)},
    user: {type: GraphQLNonNull(GraphQLUser)},
    createdAt: {type: GraphQLNonNull(GraphQLDateTime)},
    expiresAt: {type: GraphQLNonNull(GraphQLDateTime)}
  }
})
