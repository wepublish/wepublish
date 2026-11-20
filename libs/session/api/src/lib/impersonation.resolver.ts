import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import {
  AuthSession,
  Authenticated,
  CurrentUser,
} from '@wepublish/authentication/api';
import { CurrentSession, WebsiteImpersonation } from './impersonation.model';
import { ImpersonationService } from './impersonation.service';
import { SessionWithToken } from './session.model';

@Resolver()
export class ImpersonationResolver {
  constructor(private impersonationService: ImpersonationService) {}

  @Authenticated()
  @Query(() => CurrentSession)
  currentSession(@CurrentUser() session: AuthSession | null) {
    return this.impersonationService.currentSession(session);
  }

  @Authenticated()
  @Mutation(() => SessionWithToken, {
    description:
      'Signs a We.Publish supporter in to the editor as the given user for an hour. Needs a We.Publish login with the impersonate-cms role.',
  })
  impersonateUser(
    @Args('userId') userId: string,
    @Args('reason') reason: string,
    @CurrentUser() session: AuthSession | null
  ) {
    return this.impersonationService.impersonateInEditor(
      session,
      userId,
      reason
    );
  }

  @Authenticated()
  @Mutation(() => WebsiteImpersonation, {
    description:
      'Lets a We.Publish supporter open the website as the given user for an hour. Needs a We.Publish login with the impersonate-cms role.',
  })
  createWebsiteImpersonation(
    @Args('userId') userId: string,
    @Args('reason') reason: string,
    @CurrentUser() session: AuthSession | null
  ) {
    return this.impersonationService.impersonateOnWebsite(
      session,
      userId,
      reason
    );
  }
}
