import {Args, Mutation, Query, Resolver} from '@nestjs/graphql'
import {
  UserConsent,
  UserConsentInput,
  UpdateUserConsentInput,
  UserConsentFilter
} from './userConsent.model'
import {UserConsentService} from './userConsent.service'

import {UseGuards} from '@nestjs/common'
import {GqlAuthGuard} from '../auth.guard'
import {CurrentUser} from '../user.decorator.graphql'
import {UserSession} from '@wepublish/authentication/api'

@Resolver()
export class UserConsentResolver {
  constructor(private userConsents: UserConsentService) {}

  /*
  Queries
 */
  @Query(returns => [UserConsent], {
    name: 'userConsents',
    description: `
      Returns all userConsents.
    `
  })
  userConsentList(@Args('filter', {nullable: true}) filter: UserConsentFilter) {
    return this.userConsents.userConsentList(filter)
  }

  @Query(returns => UserConsent, {
    name: 'userConsent',
    description: `
      Returns userConsent by id.
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
      Create a new UserConsent.
    `
  })
  @UseGuards(GqlAuthGuard)
  createUserConsent(
    @CurrentUser() user: UserSession,
    @Args('userConsent') userConsent: UserConsentInput
  ) {
    return this.userConsents.createUserConsent(userConsent, user)
  }

  @Mutation(returns => UserConsent, {
    name: 'updateUserConsent',
    description: `
      Update an existing UserConsent.
    `
  })
  @UseGuards(GqlAuthGuard)
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
      Delete an existing UserConsent.
    `
  })
  @UseGuards(GqlAuthGuard)
  deleteUserConsent(@Args('id') id: string, @CurrentUser() user: UserSession) {
    return this.userConsents.deleteUserConsent(id, user)
  }
}
