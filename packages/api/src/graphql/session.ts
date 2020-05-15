import {
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLString,
  GraphQLID,
  GraphQLList,
  GraphQLBoolean
} from 'graphql'
import {GraphQLDateTime} from 'graphql-iso-date'

export const GraphQLPermission = new GraphQLObjectType({
  name: 'Permission',
  fields: {
    name: {type: GraphQLNonNull(GraphQLString)},
    description: {type: GraphQLNonNull(GraphQLString)}
  }
})

export const GraphQLUserRole = new GraphQLObjectType({
  name: 'UserRole',
  fields: {
    id: {type: GraphQLNonNull(GraphQLString)},
    name: {type: GraphQLNonNull(GraphQLString)},
    description: {type: GraphQLString},
    systemRole: {type: GraphQLNonNull(GraphQLBoolean)},
    permissions: {type: GraphQLNonNull(GraphQLList(GraphQLPermission))}
  }
})

export const GraphQLUser = new GraphQLObjectType({
  name: 'User',
  fields: {
    id: {type: GraphQLNonNull(GraphQLString)},
    email: {type: GraphQLNonNull(GraphQLString)},
    roles: {
      type: GraphQLNonNull(GraphQLList(GraphQLUserRole)),
      resolve({roleIDs}, args, {loaders}) {
        return Promise.all(roleIDs.map((roleID: string) => loaders.userRolesByID.load(roleID)))
      }
    }
  }
})

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
