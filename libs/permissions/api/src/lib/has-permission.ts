import { UserRole } from '@prisma/client';
import { Permission } from '@wepublish/permissions';

export function hasPermission<
  PermissionsUserRole extends Pick<UserRole, 'id' | 'permissionIDs'>,
>(
  neededPermissions: Permission | Permission[],
  userRoles: PermissionsUserRole[]
): boolean {
  const perms =
    Array.isArray(neededPermissions) ? neededPermissions : [neededPermissions];

  const hasPerms = perms.map(perm => {
    if (perm.deprecated) {
      console.warn('Permission is deprecated', perm);
    }

    const userPermissions = userRoles.flatMap(role => {
      return role.permissionIDs;
    });

    return userPermissions.some(permission => permission === perm.id);
  });

  return hasPerms.every(Boolean);
}
