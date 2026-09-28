import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { SessionService } from './session.service';
import { SessionInfo, SessionWithToken } from './session.model';
import {
  Authenticated,
  CurrentUser,
  Public,
  RequestFingerprint,
  UserSession,
} from '@wepublish/authentication/api';
import { ChallengeInput } from '@wepublish/challenge/api';
import {
  LoginCodeSecondFactorService,
  SecondFactorUser,
} from '@wepublish/login-code/api';
import { Permissions } from '@wepublish/permissions/api';
import { CanPreview, CanSendJWTLogin } from '@wepublish/permissions';

type RestrictableSession = { restricted: boolean; user: SecondFactorUser };

@Resolver()
export class SessionResolver {
  constructor(
    private sessionService: SessionService,
    private secondFactorService: LoginCodeSecondFactorService
  ) {}

  private async maskRestricted<T extends RestrictableSession>(
    session: T
  ): Promise<T> {
    if (!session.restricted) {
      return session;
    }

    return {
      ...session,
      user: await this.secondFactorService.mask(session.user),
    };
  }

  @Authenticated()
  @Query(() => SessionInfo, {
    description:
      'Origin and restriction state of the current session. Restricted sessions may only complete onboarding.',
  })
  async currentSession(
    @CurrentUser() session: UserSession
  ): Promise<SessionInfo> {
    return {
      origin: session.origin,
      restricted: session.restricted,
      placeholderEmail: session.placeholderEmail,
      secondFactor: await this.secondFactorService.getFactor(),
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
    };
  }

  @Public()
  @Query(() => Boolean, {
    description:
      'Checks whether a given email requires a TOTP code for login. Always returns true to prevent user enumeration.',
  })
  async checkLoginOtp(@Args('email') email: string) {
    return this.sessionService.checkLoginOtp(email);
  }

  @Public()
  @Mutation(() => SessionWithToken)
  async createSession(
    @Args('email') email: string,
    @Args('password') password: string,
    @Args('totpToken', { nullable: true }) totpToken?: string
  ) {
    return this.maskRestricted(
      await this.sessionService.createSessionWithEmailAndPassword(
        email,
        password,
        totpToken
      )
    );
  }

  @Public()
  @Mutation(() => SessionWithToken, {
    description:
      'Logs in with a personal login code (PURL). Limited uses, expiring and revocable; rate limited per client.',
  })
  async createSessionWithLoginCode(
    @Args('code') code: string,
    @RequestFingerprint() fingerprint: string | null,
    @Args('totpToken', { nullable: true }) totpToken?: string,
    @Args('challengeAnswer', { nullable: true, type: () => ChallengeInput })
    challengeAnswer?: ChallengeInput
  ) {
    return this.maskRestricted(
      await this.sessionService.createSessionWithLoginCode(
        code,
        totpToken,
        fingerprint,
        challengeAnswer
      )
    );
  }

  @Public()
  @Mutation(() => SessionWithToken)
  async createSessionWithJWT(
    @Args('jwt') jwt: string,
    @Args('totpToken', { nullable: true }) totpToken?: string
  ) {
    return this.maskRestricted(
      await this.sessionService.createSessionWithJWT(jwt, totpToken)
    );
  }

  @Public()
  @Mutation(() => Boolean, {
    description: 'This mutation revokes and deletes the active session.',
  })
  async revokeActiveSession(
    @CurrentUser() session: UserSession | null
  ): Promise<boolean> {
    return await this.sessionService.revokeSession(session);
  }

  @Public()
  @Mutation(() => String, {
    description:
      'This mutation sends a login link to the email if the user exists. Method will always return email address',
  })
  async sendWebsiteLogin(@Args('email') email: string) {
    await this.sessionService.sendWebsiteLogin(email);

    return email;
  }

  @Public()
  @Mutation(() => String, {
    description:
      'Sends a password reset email with a scoped JWT token. Always returns the email to prevent enumeration.',
  })
  async sendPasswordResetEmail(@Args('email') email: string) {
    return this.sessionService.sendPasswordResetEmail(email);
  }

  @Public()
  @Mutation(() => Boolean, {
    description:
      'Resets the password using a token from the password reset email. Does not create a session.',
  })
  async resetPasswordWithToken(
    @Args('token') token: string,
    @Args('password') password: string
  ) {
    return this.sessionService.resetPasswordWithToken(token, password);
  }

  @Permissions(CanSendJWTLogin)
  @Mutation(() => String, {
    description:
      'This mutation sends a login link to the email if the user exists. Method will always return email address',
  })
  async sendJWTLogin(@Args('email') email: string) {
    await this.sessionService.sendJWTLogin(email);

    return email;
  }

  @Permissions(CanPreview)
  @Mutation(() => SessionWithToken, {
    description:
      'Returns a JWT that is valid for 1min for the current logged in user.',
  })
  async createJWTForWebsiteLogin(@CurrentUser() user: UserSession) {
    return this.sessionService.createJWTForWebsiteLogin(user.user.id);
  }
}
