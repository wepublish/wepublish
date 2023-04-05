import {Args, Mutation, Query, Resolver} from '@nestjs/graphql'
import {
  UserConsent,
  UserConsentInput,
  UpdateUserConsentInput,
  UserConsentFilter
} from './user-consent.model'
import {UserConsentService} from './user-consent.service'

import {UseGuards} from '@nestjs/common'
import {UserSession, AuthenticationGuard, CurrentUser} from '@wepublish/authentication/api'

@Resolver()
export class UserConsentResolver {
  constructor(private userConsents: UserConsentService) {}

  /*
  Queries
 */
  @Query(returns => [UserConsent], {
    name: 'userConsents',
    description: `
      Returns a list of userConsents. Possible to filter.
    `
  })
  userConsentList(@Args('filter', {nullable: true}) filter: UserConsentFilter) {
    return this.userConsents.userConsentList(filter)
  }

  @Query(returns => UserConsent, {
    name: 'userConsent',
    description: `
      Returns a single userConsent by id.
    `
  })
  userConsent(@Args('id') id: string) {
    return this.userConsents.userConsent(id)
  }

  /*
  Mutations
 */
  @Mutation(returns => UserConsent, {
    name: 'createUserConsent',
    description: `
      Creates a new userConsent based on input.
      Returns created userConsent.
    `
  })
  @UseGuards(AuthenticationGuard)
  createUserConsent(
    @CurrentUser() user: UserSession,
    @Args('userConsent') userConsent: UserConsentInput
  ) {
    // only allow creating for admin or affected user
    if (!user.user.roleIDs.includes('admin') && user.user.id !== userConsent.userId) {
      throw Error(`Unauthorized`)
    }
    return this.userConsents.createUserConsent(userConsent, user)
  }

  @Mutation(returns => UserConsent, {
    name: 'updateUserConsent',
    description: `
      Updates an existing userConsent based on input.
      Returns updated userConsent.
    `
  })
  @UseGuards(AuthenticationGuard)
  updateUserConsent(
    @CurrentUser() user: UserSession,
    @Args('id') id: string,
    @Args('userConsent') userConsent: UpdateUserConsentInput
  ) {
    return this.userConsents.updateUserConsent({id, userConsent, user})
  }

  @Mutation(returns => UserConsent, {
    name: 'deleteUserConsent',
    description: `
      Delete an existing userConsent by id.
      Returns deleted userConsent.
    `
  })
  @UseGuards(AuthenticationGuard)
  deleteUserConsent(@Args('id') id: string, @CurrentUser() user: UserSession) {
    return this.userConsents.deleteUserConsent(id, user)
  }
}
