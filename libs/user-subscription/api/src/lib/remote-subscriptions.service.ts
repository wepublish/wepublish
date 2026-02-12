import { PaymentProvider } from '@wepublish/payment/api';
import { MetadataProperty, Subscription } from '@prisma/client';
import { Injectable } from '@nestjs/common';

@Injectable()
export class RemoteSubscriptionsService {
  async updateSubscription({
    paymentProvider,
    input,
    originalSubscription,
  }: {
    paymentProvider: PaymentProvider;
    input: Subscription;
    originalSubscription: Subscription & { properties: MetadataProperty[] };
  }) {
    // not updatable subscription properties for externally managed subscriptions
    if (
      (input.paymentMethodID &&
        input.paymentMethodID !== originalSubscription.paymentMethodID) ||
      (input.memberPlanID &&
        input.memberPlanID !== originalSubscription.memberPlanID) ||
      (input.paidUntil && input.paidUntil !== originalSubscription.paidUntil) ||
      (input.paymentPeriodicity &&
        input.paymentPeriodicity !== originalSubscription.paymentPeriodicity) ||
      input?.autoRenew === false
    ) {
      throw new Error(
        `It is not possible to update the subscription with payment provider "${paymentProvider.getName()}".`
      );
    }

    // update amount is possible
    if (input.monthlyAmount !== originalSubscription.monthlyAmount) {
      await paymentProvider.updateRemoteSubscriptionAmount({
        subscription: originalSubscription,
        newAmount: parseInt(`${input.monthlyAmount}`, 10),
      });
    }
  }
}
