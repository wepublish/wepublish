import { DataLoaderService } from '@wepublish/utils/api';
import { PrismaClient } from '@prisma/client';
import { Injectable, Scope } from '@nestjs/common';
import { groupBy, prop } from 'ramda';
import { UserSubscriptionOverview, UserSubscriptionStatus } from './user.model';

type SubscriptionForStatus = {
  startsAt: Date;
  paidUntil: Date | null;
  deactivation: { id: string } | null;
};

export const getUserSubscriptionStatus = (
  { startsAt, paidUntil, deactivation }: SubscriptionForStatus,
  now = new Date()
): UserSubscriptionStatus => {
  if (deactivation) {
    return UserSubscriptionStatus.Deactivated;
  }

  if (startsAt > now) {
    return UserSubscriptionStatus.Planned;
  }

  if (!paidUntil) {
    return UserSubscriptionStatus.Unpaid;
  }

  if (paidUntil < now) {
    return UserSubscriptionStatus.Expired;
  }

  return UserSubscriptionStatus.Active;
};

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
        startsAt: true,
        paidUntil: true,
        memberPlan: { select: { name: true } },
        deactivation: { select: { id: true } },
      },
      // furthest paidUntil first, like the subscriptions on the user page
      orderBy: [
        { paidUntil: { sort: 'desc', nulls: 'last' } },
        { createdAt: 'desc' },
      ],
    });

    const now = new Date();
    const grouped = groupBy(prop('userID'), subscriptions);

    return userIds.map(userId => {
      const overview = (grouped[userId] ?? []).map(subscription => ({
        id: subscription.id,
        memberPlanName: subscription.memberPlan.name,
        status: getUserSubscriptionStatus(subscription, now),
      }));

      // active ones on top, the rest keeps the paidUntil order (stable sort)
      return [
        ...overview.filter(
          ({ status }) => status === UserSubscriptionStatus.Active
        ),
        ...overview.filter(
          ({ status }) => status !== UserSubscriptionStatus.Active
        ),
      ];
    });
  }
}
