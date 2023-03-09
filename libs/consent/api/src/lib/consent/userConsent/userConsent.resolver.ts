import {Args, Mutation, Query, Resolver} from '@nestjs/graphql'
import {ConsentValue} from '@prisma/client'
// import {CanGetSubscriptions, Permissions} from '@wepublish/permissions/api'
import {UserConsent, UserConsentInput, UpdateUserConsentInput} from './userConsent.model'
import {UserConsentService} from './userConsent.service'

@Resolver()
export class UserConsentResolver {
  constructor(private userConsents: UserConsentService) {}

  /*
  Queries
 */
  // @Permissions(CanGetSubscriptions)
  @Query(returns => [UserConsent], {
    name: 'userConsents',
    description: `
      Returns all userConsents.
    `
  })
  userConsentList() {
    return this.userConsents.userConsentList()
  }

  // @Query(returns => UserConsent, {
  //   name: 'userConsent',
  //   description: `
  //     Returns userConsent by id.
  //   `
  // })
  // userConsent(id) {
  //   return this.userConsents.userConsent(id)
  // }

  /*
  Mutations
 */
  @Mutation(returns => UserConsent, {
    name: 'createUserConsent',
    description: `
      Create a new UserConsent.
    `
  })
  createUserConsent(@Args('userConsent') userConsent: UserConsentInput) {
    return this.userConsents.createUserConsent(userConsent)
  }

  @Mutation(returns => UserConsent, {
    name: 'updateUserConsent',
    description: `
      Update an existing UserConsent.
    `
  })
  updateUserConsent(
    @Args('id') id: string,
    @Args('userConsent') userConsent: UpdateUserConsentInput
  ) {
    return this.userConsents.updateUserConsent({id, userConsent})
  }

  @Mutation(returns => UserConsent, {
    name: 'deleteUserConsent',
    description: `
      Delete an existing UserConsent.
    `
  })
  deleteUserConsent(@Args('id') id: string) {
    return this.userConsents.deleteUserConsent(id)
  }
}
