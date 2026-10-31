import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { PuckBlockData } from '@wepublish/block-content/api';

import { PublicSubscription } from './subscription.model';

@Resolver(() => PuckBlockData)
export class PuckBlockDataSubscriptionsResolver {
  @ResolveField(() => [PublicSubscription], {
    nullable: true,
    description:
      'The subscriptions of the reader, empty for a reader who is not logged in.',
  })
  userSubscriptions(@Parent() { userSubscriptions }: PuckBlockData) {
    return userSubscriptions;
  }
}
