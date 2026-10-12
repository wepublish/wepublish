import { Args, Float, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UpgradeSubscription } from './upgrade-subscription.model';
import {
  Authenticated,
  CurrentUser,
  UserSession,
} from '@wepublish/authentication/api';
import { UpgradeSubscriptionService } from './upgrade-subscription.service';
import { Payment } from '@wepublish/payment/api';
import { PublicSubscription } from '../subscription/subscription.model';
import { Permissions } from '@wepublish/permissions/api';
import { CanCreateSubscription } from '@wepublish/permissions';

@Resolver(() => UpgradeSubscription)
export class UpgradeSubscriptionResolver {
  constructor(private upgradeSubscriptionService: UpgradeSubscriptionService) {}

  @Authenticated()
  @Mutation(() => Payment, {
    description: ``,
  })
  async upgradeUserSubscription(
    @CurrentUser() session: UserSession,
    @Args('subscriptionId') subscriptionId: string,
    @Args('memberPlanId') memberPlanId: string,
    @Args('monthlyAmount', {
      type: () => Float,
    })
    monthlyAmount: number,
    @Args('paymentMethodId') paymentMethodId: string,
    @Args('discountCode', { nullable: true }) discountCode?: string,
    @Args('goodieId', { nullable: true }) goodieId?: string,
    @Args('successURL', { nullable: true }) successURL?: string,
    @Args('failureURL', { nullable: true }) failureURL?: string
  ) {
    return this.upgradeSubscriptionService.upgradeSubscription({
      userId: session.user.id,
      memberPlanId,
      subscriptionId,
      paymentMethodId,
      monthlyAmount,
      goodieId,
      failureURL,
      successURL,
      discountCode,
    });
  }

  @Authenticated()
  @Mutation(() => PublicSubscription, {
    description: `Undoes an upgrade of one of the authenticated user's own subscriptions as long as the new subscription has not been paid for. The replacement subscription is removed and the original one continues.`,
  })
  async revertUserSubscriptionUpgrade(
    @CurrentUser() session: UserSession,
    @Args('subscriptionId') subscriptionId: string
  ) {
    return this.upgradeSubscriptionService.revertUpgrade({
      subscriptionId,
      userId: session.user.id,
    });
  }

  @Permissions(CanCreateSubscription)
  @Mutation(() => PublicSubscription, {
    description: `Undoes an upgrade of a subscription as long as the new subscription has not been paid for.`,
  })
  async revertSubscriptionUpgrade(@Args('id') id: string) {
    return this.upgradeSubscriptionService.revertUpgrade({
      subscriptionId: id,
      userId: null,
    });
  }

  @Authenticated()
  @Query(() => UpgradeSubscription, {
    description: ``,
  })
  async upgradeUserSubscriptionInfo(
    @CurrentUser() session: UserSession,
    @Args('subscriptionId') subscriptionId: string,
    @Args('memberPlanId') memberPlanId: string,
    @Args('discountCode', { nullable: true }) discountCode?: string
  ): Promise<UpgradeSubscription> {
    return this.upgradeSubscriptionService.getInfo({
      userId: session.user.id,
      memberPlanId,
      subscriptionId,
      discountCode,
    });
  }
}
