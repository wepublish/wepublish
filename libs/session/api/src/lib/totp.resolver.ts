import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { TotpService } from './totp.service';
import { TotpSetup } from './totp.model';
import {
  AuthenticationService,
  Authenticated,
  CurrentUser,
  assertNotImpersonating,
  requireSessionUser,
  requireUserSession,
  AuthSession,
} from '@wepublish/authentication/api';
import { Permissions } from '@wepublish/permissions/api';
import { CanResetUserTotp } from '@wepublish/permissions';

@Resolver()
export class TotpResolver {
  constructor(
    private totpService: TotpService,
    private authenticationService: AuthenticationService
  ) {}

  @Authenticated()
  @Mutation(() => TotpSetup, {
    description:
      'Generates a TOTP setup for the current user. Returns a QR code and secret for authenticator app configuration.',
  })
  async generateTotpSetup(
    @Args('website', {
      type: () => Boolean,
      nullable: true,
      description:
        'Set to true when called from a website to use the site name instead of "We.Publish CMS" in the authenticator app.',
    })
    website: boolean | undefined,
    @CurrentUser() session: AuthSession
  ) {
    assertNotImpersonating(session);

    const user = requireSessionUser(session);

    return this.totpService.setupTotp(user.id, user.email, website ?? false);
  }

  @Authenticated()
  @Mutation(() => Boolean, {
    description:
      'Enables two-factor authentication for the current user after verifying the TOTP token.',
  })
  async enableTotp(
    @Args('totpToken') totpToken: string,
    @CurrentUser() session: AuthSession
  ) {
    assertNotImpersonating(session);

    const userSession = requireUserSession(session);
    const enabled = await this.totpService.enableTotp(
      userSession.user.id,
      totpToken
    );

    await this.authenticationService.revokeUserSessions(userSession.user.id, {
      exceptToken: userSession.token,
    });

    return enabled;
  }

  @Permissions(CanResetUserTotp)
  @Mutation(() => Boolean, {
    description:
      'Resets the two-factor authentication configuration for a user. The user will need to set up 2FA again on next login.',
  })
  async resetUserTotp(@Args('userId') userId: string) {
    const reset = await this.totpService.resetTotp(userId);

    await this.authenticationService.revokeUserSessions(userId);

    return reset;
  }
}
