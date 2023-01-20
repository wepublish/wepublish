import {Args, Query, Resolver} from '@nestjs/graphql'
import {DashboardSubscription} from './dashboard-subscription.model'
import {DashboardSubscriptionService} from './dashboard-subscription.service'

@Resolver()
export class DashboardSubscriptionResolver {
  constructor(private subscriptions: DashboardSubscriptionService) {}

  @Query(returns => [DashboardSubscription], {
    name: 'newSubscribers',
    description: `
      Returns all new subscribers in a given timeframe.
      Includes already deactivated ones.
    `
  })
  newSubscribers(
    @Args('start') start: Date,
    @Args('end', {nullable: true, type: () => Date}) end: Date | null
  ) {
    return this.subscriptions.newSubscribers(start, end ?? new Date())
  }

  @Query(returns => [DashboardSubscription], {
    name: 'activeSubscribers',
    description: `
      Returns all active subscribers.
      Includes subscribers with a cancelled but not run out subscription.
    `
  })
  activeSubscribers() {
    return this.subscriptions.activeSubscribers()
  }

  @Query(returns => [DashboardSubscription], {
    name: 'renewingSubscribers',
    description: `
      Returns all renewing subscribers in a given timeframe.
    `
  })
  renewingSubscribers(
    @Args('start') start: Date,
    @Args('end', {nullable: true, type: () => Date}) end: Date | null
  ) {
    return this.subscriptions.renewingSubscribers(start, end ?? new Date())
  }

  @Query(returns => [DashboardSubscription], {
    name: 'newDeactivations',
    description: `
      Returns all new deactivations in a given timeframe.
      This considers the time the deactivation was made, not when the subscription runs out.
    `
  })
  newDeactivations(
    @Args('start') start: Date,
    @Args('end', {nullable: true, type: () => Date}) end: Date | null
  ) {
    return this.subscriptions.newDeactivations(start, end ?? new Date())
  }
}
