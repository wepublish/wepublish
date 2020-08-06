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
import {AllPermissions, EditorPermissions} from './permissions'
import {GraphQLPageInfo} from './common'
import {Context} from '../context'
import {UserRoleSort} from '../db/userRole'

export const GraphQLPermission = new GraphQLObjectType({
  name: 'Permission',
  fields: {
    id: {type: GraphQLNonNull(GraphQLString)},
    description: {type: GraphQLNonNull(GraphQLString)},
    checked: {type: GraphQLNonNull(GraphQLBoolean)},
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
        return AllPermissions.map(permission => {
          let checked
          switch (id) {
            case 'admin':
              checked = true
              break
            case 'editor':
              checked = !!EditorPermissions.find(editorPer => editorPer.id === permission.id)
              break
            default:
              checked = permissionIDs ? permissionIDs.includes(permission.id) : false
          }
          return {
            ...permission,
            checked
          }
        })
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
