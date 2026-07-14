import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { Subscription as PSubscription } from '@prisma/client';
import { PublicSubscription } from '../subscription/subscription.model';
import { GoodieDataloader } from './goodie.dataloader';
import { Goodie } from './goodie.model';

@Resolver(() => PublicSubscription)
export class SubscriptionGoodieResolver {
  constructor(private dataloader: GoodieDataloader) {}

  @ResolveField(() => Goodie, { nullable: true })
  public goodie(@Parent() subscription: PSubscription) {
    if (!subscription.goodieID) {
      return null;
    }

    return this.dataloader.load(subscription.goodieID);
  }
}
