import { UserRole } from '@prisma/client';
import { Permission } from '@wepublish/permissions';

export type PermissionsUserRole = Pick<UserRole, 'id' | 'permissionIDs'>;

export type PermissionSource = PermissionsUserRole[] | string[];

export type PermissionBearer =
  | { roles?: PermissionsUserRole[] | null; permissions?: never }
  | { permissions?: string[] | null; roles?: never };

const isPermissionIds = (source: PermissionSource): source is string[] =>
  source.every(entry => typeof entry === 'string');

export function permissionsOf(
  bearer: PermissionBearer | null | undefined
): string[] {
  if (!bearer) {
    return [];
  }

  if ('permissions' in bearer && bearer.permissions) {
    return bearer.permissions;
  }

  if ('roles' in bearer && bearer.roles) {
    return bearer.roles.flatMap(role => role.permissionIDs);
  }

  return [];
}

export function hasPermission(
  neededPermissions: Permission | Permission[],
  source: PermissionSource
): boolean {
  const perms =
    Array.isArray(neededPermissions) ? neededPermissions : [neededPermissions];

  const granted =
    isPermissionIds(source) ? source : (
      source.flatMap(role => role.permissionIDs)
    );

  return perms.every(perm => {
    if (perm.deprecated) {
      console.warn('Permission is deprecated', perm);
    }

    return granted.some(permission => permission === perm.id);
  });
}
