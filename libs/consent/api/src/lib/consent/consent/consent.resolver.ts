import {Args, Mutation, Query, Resolver} from '@nestjs/graphql'
import {
  CanCreateConsent,
  CanUpdateConsent,
  CanDeleteConsent,
  Permissions
} from '@wepublish/permissions/api'
import {Consent, ConsentInput, ConsentFilter} from './consent.model'
import {ConsentService} from './consent.service'

@Resolver()
export class ConsentResolver {
  constructor(private consents: ConsentService) {}

  /*
  Queries
 */
  @Query(returns => [Consent], {
    name: 'consents',
    description: `
      Returns all consents.
    `
  })
  consentList(@Args('filter', {nullable: true}) filter: ConsentFilter) {
    return this.consents.consentList(filter)
  }

  @Query(returns => Consent, {
    name: 'consent',
    description: `
      Returns a consent by id.
    `
  })
  consent(@Args('id') id: string) {
    return this.consents.consent(id)
  }

  /*
  Mutations
 */
  @Mutation(returns => Consent, {
    name: 'createConsent',
    description: `
      Create a new consent.
    `
  })
  @Permissions(CanCreateConsent)
  createConsent(@Args('consent') consent: ConsentInput) {
    return this.consents.createConsent(consent)
  }

  @Mutation(returns => Consent, {
    name: 'updateConsent',
    description: `
      Updates an existing consent.
    `
  })
  @Permissions(CanUpdateConsent)
  updateConsent(@Args('id') id: string, @Args('consent') consent: ConsentInput) {
    return this.consents.updateConsent({id, consent})
  }

  @Mutation(returns => Consent, {
    name: 'deleteConsent',
    description: `
      Deletes an existing consent.
    `
  })
  @Permissions(CanDeleteConsent)
  deleteConsent(@Args('id') id: string) {
    return this.consents.deleteConsent(id)
  }
}
