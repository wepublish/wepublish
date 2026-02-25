import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GqlExecutionContext } from '@nestjs/graphql';
import { INVALID_PEER_TOKEN } from './session.strategy';

/**
 * This Guard is to attach the user to the request
 */
export class OptionalAuthenticationGuard extends AuthGuard('session') {
  public override getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req;
  }

  public override async canActivate(
    context: ExecutionContext
  ): Promise<boolean> {
    try {
      await super.canActivate(context);
    } catch (e) {
      if (e instanceof UnauthorizedException) {
        if (e.cause === INVALID_PEER_TOKEN) {
          // To fake needing a token for peering,
          // we want to rethrow to stop the request from happening
          throw e;
        }

        return true;
      }

      throw e;
    }

    return true;
  }
}
