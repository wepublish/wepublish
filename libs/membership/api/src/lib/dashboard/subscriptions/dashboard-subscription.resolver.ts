import {Args, Query, Resolver} from '@nestjs/graphql'
import {CanGetSubscriptions, Permissions} from '@wepublish/permissions/api'
import {DashboardSubscription} from './dashboard-subscription.model'
import {DashboardSubscriptionService} from './dashboard-subscription.service'
import {SettingName, Settings} from '@wepublish/settings/api'

@Resolver()
export class DashboardSubscriptionResolver {
  constructor(private subscriptions: DashboardSubscriptionService) {}

  @Permissions(CanGetSubscriptions)
  @Settings(SettingName.MAKE_NEW_SUBSCRIBERS_API_PUBLIC)
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

  @Permissions(CanGetSubscriptions)
  @Settings(SettingName.MAKE_ACTIVE_SUBSCRIBERS_API_PUBLIC)
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

  @Permissions(CanGetSubscriptions)
  @Settings(SettingName.MAKE_RENEWING_SUBSCRIBERS_API_PUBLIC)
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

  @Permissions(CanGetSubscriptions)
  @Settings(SettingName.MAKE_NEW_DEACTIVATIONS_API_PUBLIC)
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
