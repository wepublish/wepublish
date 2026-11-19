import {
  Args,
  Mutation,
  Parent,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { PaymentPeriodicity, Subscription } from '@prisma/client';
import {
  Authenticated,
  CurrentUser,
  UserSession,
} from '@wepublish/authentication/api';
import { PublicSubscription } from '../subscription/subscription.model';
import { PeriodicitySwitchService } from './periodicity-switch.service';

@Resolver(() => PublicSubscription)
export class PeriodicitySwitchResolver {
  constructor(private service: PeriodicitySwitchService) {}

  @Authenticated()
  @Mutation(() => PublicSubscription, {
    description: `Changes how often one of the authenticated user's own subscriptions is billed, e.g. from monthly to yearly. The running period is kept, the new periodicity is billed from the next renewal on.`,
  })
  async switchUserSubscriptionPeriodicity(
    @Args('subscriptionId') subscriptionId: string,
    @Args('paymentPeriodicity', { type: () => PaymentPeriodicity })
    paymentPeriodicity: PaymentPeriodicity,
    @CurrentUser() session: UserSession
  ) {
    return this.service.switchPeriodicity({
      userId: session.user.id,
      subscriptionId,
      paymentPeriodicity,
    });
  }

  @ResolveField(() => [PaymentPeriodicity], {
    description: `The periodicities the subscription can be switched to with switchUserSubscriptionPeriodicity. Empty when it can't be switched (cancelled, unpaid, managed by the payment provider, …).`,
  })
  async switchablePeriodicities(@Parent() subscription: Subscription) {
    return this.service.switchablePeriodicities(subscription.id);
  }
}
