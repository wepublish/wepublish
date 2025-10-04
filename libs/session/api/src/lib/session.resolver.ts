import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { SessionService } from './session.service';
import { SessionWithToken } from './session.model';
import {
  CurrentUser,
  Public,
  UserSession,
} from '@wepublish/authentication/api';

@Resolver()
export class SessionResolver {
  constructor(private sessionService: SessionService) {}

  @Public()
  @Mutation(() => SessionWithToken)
  async createSession(
    @Args('email') email: string,
    @Args('password') password: string
  ): Promise<SessionWithToken> {
    return this.sessionService.createSessionWithEmailAndPassword(
      email,
      password
    );
  }

  @Public()
  @Mutation(() => SessionWithToken)
  async createSessionWithJWT(
    @Args('jwt') jwt: string
  ): Promise<SessionWithToken> {
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
}
