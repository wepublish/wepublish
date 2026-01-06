import { DataLoaderService } from '@wepublish/utils/api';
import { PrismaClient, SubscriptionPeriod } from '@prisma/client';
import { Injectable, Scope } from '@nestjs/common';
import { groupBy } from 'ramda';

@Injectable({
  scope: Scope.REQUEST,
})
export class SubscriptionPeriodDataloader extends DataLoaderService<
  SubscriptionPeriod[]
> {
  constructor(private prisma: PrismaClient) {
    super();
  }

  protected async loadByKeys(subscriptionIds: string[]) {
    const periods = groupBy(
      period => period.subscriptionId!,
      await this.prisma.subscriptionPeriod.findMany({
        where: {
          subscriptionId: {
            in: subscriptionIds,
          },
        },
      })
    );

    return subscriptionIds.map(subscriptionId => periods[subscriptionId] ?? []);
  }
}
