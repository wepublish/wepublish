import {ExecutionContext, UnauthorizedException} from '@nestjs/common'
import {AuthenticationGuard} from './authentication.guard'

/**
 * This Guard is to attach the user to the request
 */
export class OptionalAuthenticationGuard extends AuthenticationGuard {
  public override async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      await super.canActivate(context)
    } catch (e) {
      if (e instanceof UnauthorizedException) {
        return true
      }

      throw e
    }

    return true
  }
}
