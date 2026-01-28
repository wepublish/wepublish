import { applyDecorators } from '@nestjs/common';
import { OneOf } from '@wepublish/nest-modules';
import { PermissionsGuard } from './permission.guard';
import { Permission } from '@wepublish/permissions';
import { AddMetadata } from '@wepublish/nest-modules';

export const PERMISSIONS_METADATA_KEY = 'permissions';

/**
 * Causes the method/class to require that the current user has the permission to do the action.
 * This uses the `OneOf` decorator, so if there are multiple guards attached, only one has to return true.
 */
export const Permissions = (...permissions: Permission[]) =>
  applyDecorators(
    AddMetadata(PERMISSIONS_METADATA_KEY, permissions),
    OneOf(PermissionsGuard)
  );
