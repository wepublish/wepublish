import { DataLoaderService } from '@wepublish/utils/api';
import { PrismaClient } from '@prisma/client';
import { Injectable, Scope } from '@nestjs/common';
import { groupBy, prop } from 'ramda';
import { UserSubscriptionOverview } from './user.model';

@Injectable({
  scope: Scope.REQUEST,
})
export class UserSubscriptionOverviewDataloader extends DataLoaderService<
  UserSubscriptionOverview[]
> {
  constructor(private prisma: PrismaClient) {
    super();
  }

  protected async loadByKeys(userIds: string[]) {
    const subscriptions = await this.prisma.subscription.findMany({
      where: {
        userID: {
          in: userIds,
        },
      },
      select: {
        id: true,
        userID: true,
        memberPlan: { select: { name: true } },
        deactivation: { select: { date: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();
    const grouped = groupBy(prop('userID'), subscriptions);

    return userIds.map(userId =>
      (grouped[userId] ?? []).map(({ id, memberPlan, deactivation }) => ({
        id,
        memberPlanName: memberPlan.name,
        active: !deactivation || deactivation.date > now,
      }))
    );
  }
}
