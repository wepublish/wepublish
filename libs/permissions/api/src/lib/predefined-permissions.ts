import { UserRole } from '@prisma/client';
import {
  AllPermissions,
  EditorPermissions,
  PeerPermissions,
} from '@wepublish/permissions';

export const addPredefinedPermissions = <
  PermissionsUserRole extends Pick<UserRole, 'id' | 'permissionIDs'>,
>(
  role: PermissionsUserRole
) => {
  let permissionIDs = role.permissionIDs;

  switch (role.id) {
    case 'admin': {
      permissionIDs = [
        ...role.permissionIDs,
        ...AllPermissions.map(permission => permission.id),
      ];
      break;
    }
    case 'editor': {
      permissionIDs = [
        ...role.permissionIDs,
        ...EditorPermissions.map(permission => permission.id),
      ];
      break;
    }
    case 'peer': {
      permissionIDs = [
        ...role.permissionIDs,
        ...PeerPermissions.map(permission => permission.id),
      ];
      break;
    }
  }

  return {
    ...role,
    permissionIDs,
  };
};
