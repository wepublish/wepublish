import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Public } from '@wepublish/authentication/api';
import { SessionWithToken } from './session.model';
import { WepublishLoginClient } from './wepublish-login.model';
import { WepublishLoginService } from './wepublish-login.service';

@Resolver()
export class WepublishLoginResolver {
  constructor(private wepublishLoginService: WepublishLoginService) {}

  @Public()
  @Query(() => WepublishLoginClient, {
    nullable: true,
    description:
      'How the editor starts the We.Publish login, or null where it is off.',
  })
  wepublishLogin() {
    return this.wepublishLoginService.client();
  }

  @Public()
  @Mutation(() => SessionWithToken, {
    description:
      'Signs a We.Publish admin in with the code auth.wepublish.cloud returned: as the account connected to that We.Publish identity, else the one with its email, else a new one. The account becomes an admin with the names from We.Publish and can only sign in this way from then on.',
  })
  createSessionWithWepublishLogin(
    @Args('code') code: string,
    @Args('codeVerifier', { description: 'The PKCE verifier of the login.' })
    codeVerifier: string
  ) {
    return this.wepublishLoginService.createSession(code, codeVerifier);
  }
}
