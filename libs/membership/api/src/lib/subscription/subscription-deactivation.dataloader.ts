import { createOptionalsArray, DataLoaderService } from '@wepublish/utils/api';
import { PrismaClient, SubscriptionDeactivation } from '@prisma/client';
import { Injectable, Scope } from '@nestjs/common';

@Injectable({
  scope: Scope.REQUEST,
})
export class SubscriptionDeactivationDataloader extends DataLoaderService<SubscriptionDeactivation> {
  constructor(protected prisma: PrismaClient) {
    super();
  }

  protected async loadByKeys(subscriptionIds: string[]) {
    return createOptionalsArray(
      subscriptionIds,
      await this.prisma.subscriptionDeactivation.findMany({
        where: {
          subscriptionID: { in: subscriptionIds },
        },
      }),
      'subscriptionID'
    );
  }
}
