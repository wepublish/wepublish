import { DataLoaderService } from '@wepublish/utils/api';
import { PrismaClient } from '@prisma/client';
import { Injectable, Scope } from '@nestjs/common';
import { indexBy, prop } from 'ramda';

@Injectable({
  scope: Scope.REQUEST,
})
export class UserSubscriptionCountDataloader extends DataLoaderService<number> {
  constructor(private prisma: PrismaClient) {
    super();
  }

  protected async loadByKeys(userIds: string[]) {
    const subscriptions = await this.prisma.subscription.groupBy({
      where: {
        userID: {
          in: userIds,
        },
      },
      by: 'userID',
      _count: true,
    });

    const indexed = indexBy(prop('userID'), subscriptions);

    return userIds.map(userId => indexed[userId]?._count ?? 0);
  }
}
