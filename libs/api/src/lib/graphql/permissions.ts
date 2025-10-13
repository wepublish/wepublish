import { UserRole } from '@prisma/client';
import { Permission } from '@wepublish/permissions';
import { hasPermission } from '@wepublish/permissions/api';
import { NotAuthorisedError } from '../error';

export function authorise(
  neededPermission: Permission,
  userRoles: UserRole[]
): void {
  if (!hasPermission(neededPermission, userRoles)) {
    throw new NotAuthorisedError();
  }
}
