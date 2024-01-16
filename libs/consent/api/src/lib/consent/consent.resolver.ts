import {Args, Mutation, Query, Resolver} from '@nestjs/graphql'
import {
  CanCreateConsent,
  CanDeleteConsent,
  CanUpdateConsent,
  Permissions
} from '@wepublish/permissions/api'
import {Consent, ConsentFilter, CreateConsentInput, UpdateConsentInput} from './consent.model'
import {ConsentService} from './consent.service'

@Resolver()
export class ConsentResolver {
  constructor(private consents: ConsentService) {}

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

  @Mutation(returns => Consent, {
    name: 'createConsent',
    description: `
      Create a new consent.
    `
  })
  @Permissions(CanCreateConsent)
  createConsent(@Args() consent: CreateConsentInput) {
    return this.consents.createConsent(consent)
  }

  @Mutation(returns => Consent, {
    name: 'updateConsent',
    description: `
      Updates an existing consent.
    `
  })
  @Permissions(CanUpdateConsent)
  updateConsent(@Args() consent: UpdateConsentInput) {
    return this.consents.updateConsent(consent)
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
