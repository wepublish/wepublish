import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GqlExecutionContext } from '@nestjs/graphql';

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
        return true;
      }

      throw e;
    }

    return true;
  }
}
