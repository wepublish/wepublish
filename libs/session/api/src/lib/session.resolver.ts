import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { SessionService } from './session.service';
import { SessionWithToken } from './session.model';
import {
  CurrentUser,
  Public,
  UserSession,
} from '@wepublish/authentication/api';
import { Permissions } from '@wepublish/permissions/api';
import {
  CanLoginAsOtherUser,
  CanPreview,
  CanSendJWTLogin,
} from '@wepublish/permissions';

@Resolver()
export class SessionResolver {
  constructor(private sessionService: SessionService) {}

  @Public()
  @Mutation(() => SessionWithToken)
  async createSession(
    @Args('email') email: string,
    @Args('password') password: string
  ) {
    return this.sessionService.createSessionWithEmailAndPassword(
      email,
      password
    );
  }

  @Public()
  @Mutation(() => SessionWithToken)
  async createSessionWithJWT(@Args('jwt') jwt: string) {
    return this.sessionService.createSessionWithJWT(jwt);
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

  @Permissions(CanSendJWTLogin)
  @Mutation(() => String, {
    description:
      'This mutation sends a login link to the email if the user exists. Method will always return email address',
  })
  async sendJWTLogin(@Args('email') email: string) {
    await this.sessionService.sendJWTLogin(email);

    return email;
  }

  @Permissions(CanLoginAsOtherUser)
  @Mutation(() => SessionWithToken, {
    description: 'Returns a JWT that can be used to login as another user.',
  })
  async createJWTForUser(
    @Args('userId') userId: string,
    @Args('expiresInMinutes') expiresInMinutes: number
  ) {
    return this.sessionService.createJWTForUser(userId, expiresInMinutes);
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
