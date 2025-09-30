import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import {
  HasOptionalSubscription,
  HasOptionalSubscriptionLc,
  HasSubscription,
  HasSubscriptionLc,
} from './has-subscription.model';
import { PublicSubscription } from '../subscription.model';
import { SubscriptionDataloader } from '../subscription.dataloader';

@Resolver(() => HasSubscription)
export class HasSubscriptionResolver {
  constructor(private subscriptionDataloader: SubscriptionDataloader) {}

  @ResolveField(() => PublicSubscription, { nullable: true })
  public subscription(
    @Parent() { subscriptionID }: HasOptionalSubscription | HasSubscription
  ) {
    if (!subscriptionID) {
      return null;
    }

    return this.subscriptionDataloader.load(subscriptionID);
  }
}

@Resolver(() => HasOptionalSubscription)
export class HasOptionalSubscriptionResolver extends HasSubscriptionResolver {}

@Resolver(() => HasSubscriptionLc)
export class HasSubscriptionLcResolver {
  constructor(private subscriptionDataloader: SubscriptionDataloader) {}

  @ResolveField(() => PublicSubscription, { nullable: true })
  public subscription(
    @Parent() { subscriptionId }: HasOptionalSubscriptionLc | HasSubscriptionLc
  ) {
    if (!subscriptionId) {
      return null;
    }
    return this.subscriptionDataloader.load(subscriptionId);
  }
}

@Resolver(() => HasOptionalSubscriptionLc)
export class HasOptionalSubscriptionLcResolver extends HasSubscriptionResolver {}
