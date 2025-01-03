import {Args, Mutation, Query, Resolver} from '@nestjs/graphql'
import {
  CanCreateConsent,
  CanDeleteConsent,
  CanUpdateConsent,
  Permissions,
  Public
} from '@wepublish/permissions/api'
import {Consent, ConsentFilter, CreateConsentInput, UpdateConsentInput} from './consent.model'
import {ConsentService} from './consent.service'

@Resolver()
export class ConsentResolver {
  constructor(private consents: ConsentService) {}

  @Public()
  @Query(returns => [Consent], {
    name: 'consents',
    description: `
      Returns all consents.
    `
  })
  consentList(@Args('filter', {nullable: true}) filter: ConsentFilter) {
    return this.consents.consentList(filter)
  }

  @Public()
  @Query(returns => Consent, {
    name: 'consent',
    description: `
      Returns a consent by id.
    `
  })
  consent(@Args('id') id: string) {
    return this.consents.consent(id)
  }

  @Permissions(CanCreateConsent)
  @Mutation(returns => Consent, {
    name: 'createConsent',
    description: `
      Create a new consent.
    `
  })
  createConsent(@Args() consent: CreateConsentInput) {
    return this.consents.createConsent(consent)
  }

  @Permissions(CanUpdateConsent)
  @Mutation(returns => Consent, {
    name: 'updateConsent',
    description: `
      Updates an existing consent.
    `
  })
  updateConsent(@Args() consent: UpdateConsentInput) {
    return this.consents.updateConsent(consent)
  }

  @Permissions(CanDeleteConsent)
  @Mutation(returns => Consent, {
    name: 'deleteConsent',
    description: `
      Deletes an existing consent.
    `
  })
  deleteConsent(@Args('id') id: string) {
    return this.consents.deleteConsent(id)
  }
}
