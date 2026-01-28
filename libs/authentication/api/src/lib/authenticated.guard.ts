import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AUTHENTICATED_METADATA_KEY } from './authenticated.decorator';

@Injectable()
export class AuthenticatedGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  public canActivate(context: ExecutionContext): boolean {
    const ctx = GqlExecutionContext.create(context);

    const requiresAuthentication = this.reflector.getAllAndOverride<boolean>(
      AUTHENTICATED_METADATA_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!requiresAuthentication) {
      return true;
    }

    const request = ctx.getContext().req;
    const session = request.user;

    return !!session;
  }
}
