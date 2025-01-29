import {Parent, ResolveField, Resolver} from '@nestjs/graphql'
import {HasSubscription, HasOptionalSubscription} from './has-subscription.model'
import {PublicSubscription} from '../subscription.model'

@Resolver(() => HasSubscription)
export class HasSubscriptionResolver {
  @ResolveField(() => PublicSubscription, {nullable: true})
  public subscription(@Parent() {subscriptionId}: HasOptionalSubscription | HasSubscription) {
    if (!subscriptionId) {
      return null
    }

    return {
      __typename: 'PublicSubscription',
      id: subscriptionId
    }
  }
}

@Resolver(() => HasOptionalSubscription)
export class HasOptionalSubscriptionResolver extends HasSubscriptionResolver {}
