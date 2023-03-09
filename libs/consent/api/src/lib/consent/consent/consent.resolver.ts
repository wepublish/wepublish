import {Args, Mutation, Query, Resolver} from '@nestjs/graphql'
// import {CanGetSubscriptions, Permissions} from '@wepublish/permissions/api'
import {Consent, ConsentInput} from './consent.model'
import {ConsentService} from './consent.service'

@Resolver()
export class ConsentResolver {
  constructor(private consents: ConsentService) {}

  /*
  Queries
 */
  // @Permissions(CanGetSubscriptions)
  @Query(returns => [Consent], {
    name: 'consents',
    description: `
      Returns all Consents.
    `
  })
  consentList() {
    return this.consents.consentList()
  }

  @Query(returns => Consent, {
    name: 'consent',
    description: `
      Returns Consent by id.
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
      Create a new Consent.
    `
  })
  createConsent(@Args('consent') consent: ConsentInput) {
    return this.consents.createConsent(consent)
  }

  @Mutation(returns => Consent, {
    name: 'updateConsent',
    description: `
      Update an existing Consent.
    `
  })
  updateConsent(@Args('id') id: string, @Args('consent') consent: ConsentInput) {
    return this.consents.updateConsent({id, consent})
  }

  @Mutation(returns => Consent, {
    name: 'deleteConsent',
    description: `
      Deletes an existing Consent.
    `
  })
  deleteConsent(@Args('id') id: string) {
    return this.consents.deleteConsent(id)
  }

  // @Permissions(CanGetSubscriptions)
  // @Query(returns => [DashboardSubscription], {
  //   name: 'activeSubscribers',
  //   description: `
  //     Returns all active subscribers.
  //     Includes subscribers with a cancelled but not run out subscription.
  //   `
  // })
  // activeSubscribers() {
  //   return this.subscriptions.activeSubscribers()
  // }

  // @Permissions(CanGetSubscriptions)
  // @Query(returns => [DashboardSubscription], {
  //   name: 'renewingSubscribers',
  //   description: `
  //     Returns all renewing subscribers in a given timeframe.
  //   `
  // })
  // renewingSubscribers(
  //   @Args('start') start: Date,
  //   @Args('end', {nullable: true, type: () => Date}) end: Date | null
  // ) {
  //   return this.subscriptions.renewingSubscribers(start, end ?? new Date())
  // }

  // @Permissions(CanGetSubscriptions)
  // @Query(returns => [DashboardSubscription], {
  //   name: 'newDeactivations',
  //   description: `
  //     Returns all new deactivations in a given timeframe.
  //     This considers the time the deactivation was made, not when the subscription runs out.
  //   `
  // })
  // newDeactivations(
  //   @Args('start') start: Date,
  //   @Args('end', {nullable: true, type: () => Date}) end: Date | null
  // ) {
  //   return this.subscriptions.newDeactivations(start, end ?? new Date())
  // }
}
