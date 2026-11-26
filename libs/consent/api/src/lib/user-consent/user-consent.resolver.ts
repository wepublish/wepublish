import {
  Args,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import {
  UserConsent,
  UserConsentFilter,
  UserConsentInput,
} from './user-consent.model';
import { UserConsentService } from './user-consent.service';

import { ForbiddenException } from '@nestjs/common';
import {
  Authenticated,
  CurrentUser,
  Public,
  AuthSession,
  requireSessionUser,
  requireUserSession,
} from '@wepublish/authentication/api';
import { User, UserDataloaderService } from '@wepublish/user/api';

@Resolver(() => UserConsent)
export class UserConsentResolver {
  constructor(
    private userConsents: UserConsentService,
    private userDataloaderService: UserDataloaderService
  ) {}

  @Public()
  @Query(returns => [UserConsent], {
    name: 'userConsents',
    description: `
      Returns a list of userConsents. Possible to filter.
    `,
  })
  userConsentList(@Args({ nullable: true }) filter?: UserConsentFilter) {
    return this.userConsents.userConsentList(filter);
  }

  @Public()
  @Query(returns => UserConsent, {
    name: 'userConsent',
    description: `
      Returns a single userConsent by id.
    `,
  })
  userConsent(@Args('id') id: string) {
    return this.userConsents.userConsent(id);
  }

  @Authenticated()
  @Mutation(returns => UserConsent, {
    name: 'createUserConsent',
    description: `
      Creates a new userConsent based on input.
      Returns created userConsent.
    `,
  })
  createUserConsent(
    @CurrentUser() session: AuthSession,
    @Args() userConsent: UserConsentInput
  ) {
    const user = requireSessionUser(session);

    // only allow creating for admin or affected user
    if (!user.roleIDs.includes('admin') && user.id !== userConsent.userId) {
      throw new ForbiddenException();
    }

    return this.userConsents.createUserConsent(userConsent);
  }

  @Authenticated()
  @Mutation(returns => UserConsent, {
    name: 'updateUserConsent',
    description: `
      Updates an existing userConsent based on input.
      Returns updated userConsent.
    `,
  })
  updateUserConsent(
    @CurrentUser() session: AuthSession,
    @Args('id') id: string,
    @Args('value', { type: () => Boolean }) value: boolean
  ) {
    return this.userConsents.updateUserConsent(
      id,
      value,
      requireUserSession(session)
    );
  }

  @Authenticated()
  @Mutation(returns => UserConsent, {
    name: 'deleteUserConsent',
    description: `
      Delete an existing userConsent by id.
      Returns deleted userConsent.
    `,
  })
  deleteUserConsent(
    @Args('id') id: string,
    @CurrentUser() session: AuthSession
  ) {
    return this.userConsents.deleteUserConsent(id, requireUserSession(session));
  }

  @ResolveField(returns => User)
  user(@Parent() userConsent: UserConsent) {
    return this.userDataloaderService.load(userConsent.userId);
  }
}
