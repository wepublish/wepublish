import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { TotpService } from './totp.service';
import { TotpSetup } from './totp.model';
import {
  AuthenticationService,
  CurrentUser,
  RequiresFullSession,
  UserSession,
} from '@wepublish/authentication/api';
import { Permissions } from '@wepublish/permissions/api';
import { CanResetUserTotp } from '@wepublish/permissions';

@Resolver()
export class TotpResolver {
  constructor(
    private totpService: TotpService,
    private authenticationService: AuthenticationService
  ) {}

  @RequiresFullSession()
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
    @CurrentUser() { user }: UserSession
  ) {
    return this.totpService.setupTotp(user.id, user.email, website ?? false);
  }

  @RequiresFullSession()
  @Mutation(() => Boolean, {
    description:
      'Enables two-factor authentication for the current user after verifying the TOTP token.',
  })
  async enableTotp(
    @Args('totpToken') totpToken: string,
    @CurrentUser() session: UserSession
  ) {
    const enabled = await this.totpService.enableTotp(
      session.user.id,
      totpToken
    );

    await this.authenticationService.revokeUserSessions(session.user.id, {
      exceptToken: session.token,
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
