import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import {
  EligibilityList,
  EligibilitySubscription,
  isEligibleForNewsletterList,
} from './newsletter-eligibility';

const eligibilitySelect = {
  userID: true,
  memberPlanID: true,
  confirmed: true,
  startsAt: true,
  paidUntil: true,
  paymentMethod: { select: { gracePeriod: true } },
} satisfies Prisma.SubscriptionSelect;

type EligibilityRow = Prisma.SubscriptionGetPayload<{
  select: typeof eligibilitySelect;
}>;

const toEligibilitySubscription = ({
  memberPlanID,
  confirmed,
  startsAt,
  paidUntil,
  paymentMethod,
}: EligibilityRow): EligibilitySubscription => ({
  memberPlanID,
  confirmed,
  startsAt,
  paidUntil,
  gracePeriod: paymentMethod.gracePeriod,
});

@Injectable()
export class NewsletterEligibilityService {
  constructor(private prisma: PrismaClient) {}

  async subscriptionsByUser(
    userIds: string[]
  ): Promise<Map<string, EligibilitySubscription[]>> {
    const subscriptionsByUser = new Map<string, EligibilitySubscription[]>();

    if (!userIds.length) {
      return subscriptionsByUser;
    }

    const rows = await this.prisma.subscription.findMany({
      where: { userID: { in: userIds } },
      select: eligibilitySelect,
    });

    for (const row of rows) {
      subscriptionsByUser.set(row.userID, [
        ...(subscriptionsByUser.get(row.userID) ?? []),
        toEligibilitySubscription(row),
      ]);
    }

    return subscriptionsByUser;
  }

  async eligibleUserIds(list: EligibilityList): Promise<string[]> {
    const rows = await this.prisma.subscription.findMany({
      where: {
        confirmed: true,
        user: { active: true },
        ...(list.anyMemberPlan ?
          {}
        : { memberPlanID: { in: list.memberPlanIds } }),
      },
      select: eligibilitySelect,
    });

    const userIds = rows
      .filter(row =>
        isEligibleForNewsletterList(list, [toEligibilitySubscription(row)])
      )
      .map(row => row.userID);

    return [...new Set(userIds)];
  }
}
