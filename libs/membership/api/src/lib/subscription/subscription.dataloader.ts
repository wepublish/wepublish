import { createOptionalsArray, DataLoaderService } from '@wepublish/utils/api';
import { PrismaClient, Subscription } from '@prisma/client';
import { Injectable, Scope } from '@nestjs/common';

@Injectable({
  scope: Scope.REQUEST,
})
export class SubscriptionDataloader extends DataLoaderService<Subscription> {
  constructor(protected prisma: PrismaClient) {
    super();
  }

  protected async loadByKeys(ids: string[]) {
    return createOptionalsArray(
      ids,
      await this.prisma.subscription.findMany({
        where: { id: { in: ids } },
      }),
      'id'
    );
  }
}
