import {Args, Mutation, Resolver} from '@nestjs/graphql'
import {SessionService} from './session.service'
import {SessionWithToken} from './session.model'
import {CurrentUser, Public, UserSession} from '@wepublish/authentication/api'

@Resolver()
export class SessionResolver {
  constructor(private readonly sessionService: SessionService) {}

  @Public()
  @Mutation(() => SessionWithToken)
  async createSession(
    @Args('email') email: string,
    @Args('password') password: string
  ): Promise<SessionWithToken> {
    return this.sessionService.createSessionWithEmailAndPassword(email, password)
  }

  @Public()
  @Mutation(() => SessionWithToken)
  async createSessionWithJWT(@Args('jwt') jwt: string): Promise<SessionWithToken> {
    return this.sessionService.createSessionWithJWT(jwt)
  }

  @Public()
  @Mutation(() => SessionWithToken)
  async createSessionWithOAuth2Code(
    @Args('provider') provider: string,
    @Args('code') code: string,
    @Args('redirectUri') redirectUri: string
  ): Promise<SessionWithToken> {
    return this.sessionService.createOAuth2Session(provider, code, redirectUri)
  }

  @Public()
  @Mutation(() => Boolean, {
    description: 'This mutation revokes and deletes the active session.'
  })
  async revokeActiveSession(@CurrentUser() session: UserSession | null): Promise<Boolean> {
    console.log({session})

    return await this.sessionService.revokeSession(session)
  }
}
