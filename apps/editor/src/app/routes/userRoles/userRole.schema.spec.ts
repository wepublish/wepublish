import type { FullUserRoleFragment } from '@wepublish/editor/api';
import { resolveKind, schemaAt } from '@wepublish/form/core';
import {
  AllPermissions,
  CanCreateArticle,
  CanGetArticles,
} from '@wepublish/permissions';

import {
  fromUserRole,
  permissionOptions,
  toUserRoleVariables,
  userRoleSchema,
} from './userRole.schema';

const userRole: FullUserRoleFragment = {
  __typename: 'UserRole',
  id: 'role-1',
  name: 'Redaktion',
  description: null,
  systemRole: false,
  permissions: [CanCreateArticle, CanGetArticles].map(permission => ({
    __typename: 'Permission' as const,
    ...permission,
  })),
};

describe('user role schema', () => {
  it('edits the permissions as a multi-select', () => {
    const permissions = schemaAt(userRoleSchema, 'permissions');

    expect(
      permissions === undefined ? undefined : resolveKind(permissions)?.kind
    ).toBe('enumArray');
  });

  it('offers every permission, labelled by its description', () => {
    expect(permissionOptions).toEqual(
      AllPermissions.map(({ id, description }) => ({
        value: id,
        label: description,
      }))
    );
  });

  it('rejects a permission the API does not know', () => {
    expect(
      userRoleSchema.safeParse({
        name: 'Redaktion',
        description: '',
        permissions: ['CAN_FLY'],
      }).success
    ).toBe(false);
  });

  it('loads the permission ids in their stored order and an empty description', () => {
    expect(fromUserRole(userRole)).toStrictEqual({
      name: 'Redaktion',
      description: '',
      permissions: ['CAN_CREATE_ARTICLE', 'CAN_GET_ARTICLES'],
    });
  });

  it('maps the values to the mutation variables', () => {
    expect(
      toUserRoleVariables({
        name: 'Redaktion',
        description: '',
        permissions: ['CAN_CREATE_ARTICLE', 'CAN_GET_ARTICLES'],
      })
    ).toStrictEqual({
      name: 'Redaktion',
      description: '',
      permissionIDs: ['CAN_CREATE_ARTICLE', 'CAN_GET_ARTICLES'],
    });
  });
});
