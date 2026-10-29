import { createOptionalsArray, DataLoaderService } from '@wepublish/utils/api';
import {
  PaymentMethodChangeState,
  PrismaClient,
  SubscriptionPaymentMethodChange,
} from '@prisma/client';
import { Injectable, Scope } from '@nestjs/common';

/** The pending payment method change of a subscription, by subscription id. */
@Injectable({
  scope: Scope.REQUEST,
})
export class PendingPaymentMethodChangeDataloader extends DataLoaderService<SubscriptionPaymentMethodChange> {
  constructor(protected prisma: PrismaClient) {
    super();
  }

  protected async loadByKeys(subscriptionIds: string[]) {
    return createOptionalsArray(
      subscriptionIds,
      await this.prisma.subscriptionPaymentMethodChange.findMany({
        where: {
          subscriptionID: { in: subscriptionIds },
          state: PaymentMethodChangeState.pending,
        },
      }),
      'subscriptionID'
    );
  }
}
