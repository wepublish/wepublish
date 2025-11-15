import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UpgradeSubscription } from './upgrade-subscription.model';
import {
  Authenticated,
  CurrentUser,
  UserSession,
} from '@wepublish/authentication/api';
import { UpgradeSubscriptionService } from './upgrade-subscription.service';
import { Payment } from '@wepublish/payment/api';

@Resolver(() => UpgradeSubscription)
export class UpgradeSubscriptionResolver {
  constructor(private upgradeSubscriptionService: UpgradeSubscriptionService) {}

  @Authenticated()
  @Mutation(() => Payment, {
    description: ``,
  })
  async upgradeSubscription(
    @CurrentUser() session: UserSession,
    @Args('subscriptionId') subscriptionId: string,
    @Args('memberPlanId') memberPlanId: string,
    @Args('monthlyAmount', {
      type: () => Int,
    })
    monthlyAmount: number,
    @Args('paymentMethodId') paymentMethodId: string,
    @Args('successURL', { nullable: true }) successURL?: string,
    @Args('failureURL', { nullable: true }) failureURL?: string
  ) {
    return this.upgradeSubscriptionService.upgradeSubscription({
      userId: session.user.id,
      memberPlanId,
      subscriptionId,
      paymentMethodId,
      monthlyAmount,
      failureURL,
      successURL,
    });
  }

  @Authenticated()
  @Query(() => UpgradeSubscription, {
    description: ``,
  })
  async upgradeSubscriptionInfo(
    @CurrentUser() session: UserSession,
    @Args('subscriptionId') subscriptionId: string,
    @Args('memberPlanId') memberPlanId: string
  ): Promise<UpgradeSubscription> {
    return {
      discountAmount: await this.upgradeSubscriptionService.getInfo({
        userId: session.user.id,
        memberPlanId,
        subscriptionId,
      }),
    };
  }
}
