import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLInputObjectType,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import {
  AllPermissions,
  EditorPermissions,
  PeerPermissions,
} from '@wepublish/permissions';
import { GraphQLPageInfo } from './common';
import { Context } from '../context';
import { UserRoleSort } from '../db/userRole';

export const GraphQLPermission = new GraphQLObjectType({
  name: 'Permission',
  fields: {
    id: { type: new GraphQLNonNull(GraphQLString) },
    description: { type: new GraphQLNonNull(GraphQLString) },
    deprecated: { type: new GraphQLNonNull(GraphQLBoolean) },
  },
});

export const GraphQLUserRole = new GraphQLObjectType({
  name: 'UserRole',
  fields: {
    id: { type: new GraphQLNonNull(GraphQLString) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    description: { type: GraphQLString },
    systemRole: { type: new GraphQLNonNull(GraphQLBoolean) },
    permissions: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(GraphQLPermission))
      ),
      resolve({ id, permissionIDs }) {
        switch (id) {
          case 'admin':
            return AllPermissions;
          case 'editor':
            return EditorPermissions;
          case 'peer':
            return PeerPermissions;
          default:
            return AllPermissions.filter(permission =>
              permissionIDs.includes(permission.id)
            );
        }
      },
    },
  },
});

export const GraphQLUserRoleConnection = new GraphQLObjectType<any, Context>({
  name: 'UserRoleConnection',
  fields: {
    nodes: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(GraphQLUserRole))
      ),
    },
    pageInfo: { type: new GraphQLNonNull(GraphQLPageInfo) },
    totalCount: { type: new GraphQLNonNull(GraphQLInt) },
  },
});

export const GraphQLUserRoleInput = new GraphQLInputObjectType({
  name: 'UserRoleInput',
  fields: {
    name: { type: new GraphQLNonNull(GraphQLString) },
    description: { type: new GraphQLNonNull(GraphQLString) },
    permissionIDs: { type: new GraphQLList(new GraphQLNonNull(GraphQLString)) },
  },
});

export const GraphQLUserRoleFilter = new GraphQLInputObjectType({
  name: 'UserRoleFilter',
  fields: {
    name: { type: GraphQLString },
  },
});

export const GraphQLUserRoleSort = new GraphQLEnumType({
  name: 'UserRoleSort',
  values: {
    [UserRoleSort.CreatedAt]: { value: UserRoleSort.CreatedAt },
    [UserRoleSort.ModifiedAt]: { value: UserRoleSort.ModifiedAt },
  },
});
