import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_METADATA_KEY } from './permission.decorator';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Permission } from '@wepublish/permissions';
import { hasPermission } from './has-permission';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  public canActivate(context: ExecutionContext): boolean {
    const ctx = GqlExecutionContext.create(context);

    const permissions = this.reflector.getAllAndMerge<Permission[]>(
      PERMISSIONS_METADATA_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!permissions.length) {
      return false;
    }

    const request = ctx.getContext().req;
    const session = request.user;

    if (!session) {
      return false;
    }

    return hasPermission(permissions, session.roles);
  }
}
