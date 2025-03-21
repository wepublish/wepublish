import {GraphQLObjectType, GraphQLNonNull, GraphQLString} from 'graphql'
import {GraphQLDateTime} from 'graphql-scalars'
import {GraphQLPublicUser, GraphQLUser} from './user'

export const GraphQLSessionWithToken = new GraphQLObjectType({
  name: 'SessionWithToken',
  fields: {
    id: {type: new GraphQLNonNull(GraphQLString)},
    user: {type: new GraphQLNonNull(GraphQLUser)},
    token: {type: new GraphQLNonNull(GraphQLString)},
    createdAt: {type: new GraphQLNonNull(GraphQLDateTime)},
    expiresAt: {type: new GraphQLNonNull(GraphQLDateTime)}
  }
})

export const GraphQLPublicSessionWithToken = new GraphQLObjectType({
  name: 'SessionWithToken',
  fields: {
    user: {type: new GraphQLNonNull(GraphQLPublicUser)},
    token: {type: new GraphQLNonNull(GraphQLString)},
    createdAt: {type: new GraphQLNonNull(GraphQLDateTime)},
    expiresAt: {type: new GraphQLNonNull(GraphQLDateTime)}
  }
})

export const GraphQLSession = new GraphQLObjectType({
  name: 'Session',
  fields: {
    id: {type: new GraphQLNonNull(GraphQLString)},
    user: {type: new GraphQLNonNull(GraphQLUser)},
    createdAt: {type: new GraphQLNonNull(GraphQLDateTime)},
    expiresAt: {type: new GraphQLNonNull(GraphQLDateTime)}
  }
})
