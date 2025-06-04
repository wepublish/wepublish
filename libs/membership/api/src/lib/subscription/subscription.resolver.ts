import {Query, Resolver} from '@nestjs/graphql'
import {PublicSubscription} from './subscription.model'
import {SubscriptionService} from './subscription.service'
import {Authenticated, CurrentUser, UserSession} from '@wepublish/authentication/api'

@Resolver(() => PublicSubscription)
export class SubscriptionResolver {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Authenticated()
  @Query(() => [PublicSubscription], {
    description: `This query returns the subscriptions of the authenticated user.`
  })
  async subscriptions(@CurrentUser() session: UserSession) {
    return this.subscriptionService.getUserSubscriptions(session.user.id)
  }
}
