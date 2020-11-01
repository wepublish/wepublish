import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLInputObjectType,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString
} from 'graphql'
import {AllPermissions, EditorPermissions, PeerPermissions} from './permissions'
import {GraphQLPageInfo} from './common'
import {Context} from '../context'
import {UserRoleSort} from '../db/userRole'

export const GraphQLPermission = new GraphQLObjectType({
  name: 'Permission',
  fields: {
    id: {type: GraphQLNonNull(GraphQLString)},
    description: {type: GraphQLNonNull(GraphQLString)},
    deprecated: {type: GraphQLNonNull(GraphQLBoolean)}
  }
})

export const GraphQLUserRole = new GraphQLObjectType({
  name: 'UserRole',
  fields: {
    id: {type: GraphQLNonNull(GraphQLString)},
    name: {type: GraphQLNonNull(GraphQLString)},
    description: {type: GraphQLString},
    systemRole: {type: GraphQLNonNull(GraphQLBoolean)},
    permissions: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLPermission))),
      resolve({id, permissionIDs}, args, {loaders}) {
        switch (id) {
          case 'admin':
            return AllPermissions
          case 'editor':
            return EditorPermissions
          case 'peer':
            return PeerPermissions
          default:
            return AllPermissions.filter(permission => permissionIDs.includes(permission.id))
        }
      }
    }
  }
})

export const GraphQLUserRoleConnection = new GraphQLObjectType<any, Context>({
  name: 'UserRoleConnection',
  fields: {
    nodes: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLUserRole)))},
    pageInfo: {type: GraphQLNonNull(GraphQLPageInfo)},
    totalCount: {type: GraphQLNonNull(GraphQLInt)}
  }
})

export const GraphQLUserRoleInput = new GraphQLInputObjectType({
  name: 'UserRoleInput',
  fields: {
    name: {type: GraphQLNonNull(GraphQLString)},
    description: {type: GraphQLNonNull(GraphQLString)},
    permissionIDs: {type: GraphQLList(GraphQLNonNull(GraphQLString))}
  }
})

export const GraphQLUserRoleFilter = new GraphQLInputObjectType({
  name: 'UserRoleFilter',
  fields: {
    name: {type: GraphQLString}
  }
})

export const GraphQLUserRoleSort = new GraphQLEnumType({
  name: 'UserRoleSort',
  values: {
    CREATED_AT: {value: UserRoleSort.CreatedAt},
    MODIFIED_AT: {value: UserRoleSort.ModifiedAt}
  }
})
