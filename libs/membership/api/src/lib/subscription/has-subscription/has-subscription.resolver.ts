import {Parent, ResolveField, Resolver} from '@nestjs/graphql'
import {HasSubscription, HasOptionalSubscription} from './has-subscription.model'
import {Subscription} from '../subscription.model'

@Resolver(() => HasOptionalSubscription)
@Resolver(() => HasSubscription)
export class HasSubscriptionResolver {
  @ResolveField(() => Subscription, {nullable: true})
  public subscription(@Parent() {subscriptionId}: HasOptionalSubscription | HasSubscription) {
    if (!subscriptionId) {
      return null
    }

    return {
      __typename: 'Subscription',
      id: subscriptionId
    }
  }
}
