import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthSessionType } from './auth-session';
import { FULL_SESSION_METADATA_KEY } from './full-session.decorator';

export const SESSION_RESTRICTED = 'SESSION_RESTRICTED';

@Injectable()
export class FullSessionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  public canActivate(context: ExecutionContext): boolean {
    const requiresFullSession = this.reflector.getAllAndOverride<boolean>(
      FULL_SESSION_METADATA_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!requiresFullSession) {
      return true;
    }

    const session = GqlExecutionContext.create(context).getContext().req.user;

    if (session?.type === AuthSessionType.User && session.restricted) {
      throw new ForbiddenException(SESSION_RESTRICTED);
    }

    return true;
  }
}
