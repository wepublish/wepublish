import {UserRole} from '@prisma/client'
import {Permission, AllPermissions, EditorPermissions, PeerPermissions} from './permissions'

export function hasPermission(
  neededPermissions: Permission | Permission[],
  userRoles: UserRole[]
): boolean {
  const perms = Array.isArray(neededPermissions) ? neededPermissions : [neededPermissions]

  const hasPerms = perms.map(perm => {
    if (perm.deprecated) {
      console.warn('Permission is deprecated', perm)
    }

    const userPermissions = userRoles.reduce<string[]>((permissions, role) => {
      switch (role.id) {
        case 'admin':
          return [...permissions, ...AllPermissions.map(permission => permission.id)]
        case 'editor':
          return [...permissions, ...EditorPermissions.map(permission => permission.id)]
        case 'peer':
          return [...permissions, ...PeerPermissions.map(permission => permission.id)]
      }

      return [...permissions, ...role.permissionIDs]
    }, [])

    return userPermissions.some(permission => permission === perm.id)
  })

  return hasPerms.every(Boolean)
}
