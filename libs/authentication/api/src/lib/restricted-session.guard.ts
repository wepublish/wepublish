import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthSessionType } from './auth-session';
import { PUBLIC_METADATA_KEY } from './public.decorator';
import { ALLOWS_RESTRICTED_SESSION_METADATA_KEY } from './restricted-session.decorator';
import { SESSION_RESTRICTED } from './session-restriction';

/**
 * Refuses a restricted session everywhere except on public handlers and on
 * those marked with `@AllowsRestrictedSession()`. A public handler that acts
 * as the signed-in user checks for itself, with `fullUserSessionOf`.
 */
@Injectable()
export class RestrictedSessionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  public canActivate(context: ExecutionContext): boolean {
    const targets = [context.getHandler(), context.getClass()];

    // Decided before the request is read: controllers are public and have no
    // GraphQL context to read it from.
    if (
      this.reflector.getAllAndOverride<boolean>(PUBLIC_METADATA_KEY, targets) ||
      this.reflector.getAllAndOverride<boolean>(
        ALLOWS_RESTRICTED_SESSION_METADATA_KEY,
        targets
      )
    ) {
      return true;
    }

    const request =
      context.getType<string>() === 'http' ?
        context.switchToHttp().getRequest()
      : GqlExecutionContext.create(context).getContext().req;
    const session = request?.user;

    if (session?.type === AuthSessionType.User && session.restricted) {
      throw new ForbiddenException(SESSION_RESTRICTED);
    }

    return true;
  }
}
