import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { ok } from 'assert';
import {
  DailySubscriptionStats,
  DashboardSubscription,
} from './dashboard-subscription.model';
import {
  differenceInDays,
  endOfDay,
  startOfDay,
  format,
  subDays,
} from 'date-fns';
import NodeCache from 'node-cache';
import { createHash } from 'crypto';
import { gt } from 'ramda';

/**
 * Stats cache configuration and setup
 */
const ONE_MIN_IN_SEC = 60;
const ONE_HOUR_IN_SEC = ONE_MIN_IN_SEC * 60;
const dailyStatsCache = new NodeCache({
  checkperiod: ONE_MIN_IN_SEC,
  deleteOnExpire: true,
  useClones: true,
});

@Injectable()
export class DashboardSubscriptionService {
  constructor(private prisma: PrismaClient) {}

  async newSubscribers(
    start: Date,
    end: Date
  ): Promise<DashboardSubscription[]> {
    const data = await this.prisma.subscription.findMany({
      where: {
        startsAt: {
          gte: start,
          lt: end,
        },
      },
      orderBy: {
        startsAt: 'desc',
      },
      include: {
        deactivation: true,
        memberPlan: {
          select: {
            name: true,
          },
        },
      },
    });

    return data.map(
      ({
        autoRenew,
        paidUntil,
        monthlyAmount,
        startsAt,
        deactivation,
        paymentPeriodicity,
        memberPlan: { name: memberPlan },
      }) => ({
        startsAt,
        endsAt: deactivation?.date ?? ((autoRenew && paidUntil) || undefined),
        renewsAt: (autoRenew && paidUntil) || undefined,
        monthlyAmount,
        paymentPeriodicity,
        reasonForDeactivation: deactivation?.reason,
        deactivationDate: deactivation?.createdAt,
        memberPlan,
      })
    );
  }

  async activeSubscribers(): Promise<DashboardSubscription[]> {
    const data = await this.prisma.subscription.findMany({
      where: {
        OR: [
          {
            deactivation: null,
            paidUntil: {
              gte: new Date(),
            },
          },
          {
            deactivation: {
              date: {
                gte: new Date(),
              },
            },
          },
        ],
      },
      orderBy: {
        startsAt: 'desc',
      },
      include: {
        deactivation: true,
        memberPlan: {
          select: {
            name: true,
          },
        },
      },
    });

    return data.map(
      ({
        autoRenew,
        paidUntil,
        monthlyAmount,
        startsAt,
        deactivation,
        paymentPeriodicity,
        memberPlan: { name: memberPlan },
      }) => ({
        startsAt,
        endsAt: deactivation?.date ?? ((autoRenew && paidUntil) || undefined),
        renewsAt: (autoRenew && paidUntil) || undefined,
        monthlyAmount,
        paymentPeriodicity,
        reasonForDeactivation: deactivation?.reason,
        deactivationDate: deactivation?.createdAt,
        memberPlan,
      })
    );
  }

  async renewingSubscribers(
    start: Date,
    end: Date
  ): Promise<DashboardSubscription[]> {
    const data = await this.prisma.subscription.findMany({
      where: {
        paidUntil: {
          gte: start,
          lte: end,
        },
        autoRenew: true,
        deactivation: null,
      },
      orderBy: {
        paidUntil: 'desc',
      },
      include: {
        memberPlan: {
          select: {
            name: true,
          },
        },
      },
    });

    return data.map(
      ({
        monthlyAmount,
        startsAt,
        paidUntil,
        paymentPeriodicity,
        memberPlan: { name: memberPlan },
      }) => {
        ok(paidUntil);

        return {
          startsAt,
          renewsAt: paidUntil,
          monthlyAmount,
          paymentPeriodicity,
          memberPlan,
        };
      }
    );
  }

  async newDeactivations(
    start: Date,
    end: Date
  ): Promise<DashboardSubscription[]> {
    const data = await this.prisma.subscription.findMany({
      where: {
        deactivation: {
          createdAt: {
            gte: start,
            lte: end,
          },
        },
      },
      orderBy: {
        deactivation: {
          createdAt: 'desc',
        },
      },
      include: {
        deactivation: true,
        memberPlan: {
          select: {
            name: true,
          },
        },
      },
    });

    return data.map(
      ({
        memberPlan: { name: memberPlan },
        monthlyAmount,
        deactivation,
        startsAt,
        paymentPeriodicity,
      }) => {
        ok(deactivation);

        return {
          startsAt,
          endsAt: deactivation.date,
          reasonForDeactivation: deactivation.reason,
          deactivationDate: deactivation.createdAt,
          paymentPeriodicity,
          monthlyAmount,
          memberPlan,
        };
      }
    );
  }

  private async getDailyCreatedSubscriptions(
    date: Date,
    memberPlanIds: string[] = []
  ) {
    if (date > new Date(new Date().getTime() + 24 * 60 * 60 * 1000)) {
      return [];
    }

    const start = startOfDay(date);
    const end = endOfDay(date);
    let memberPlanFilter: Prisma.SubscriptionWhereInput = {};
    if (memberPlanIds.length > 0) {
      memberPlanFilter = {
        memberPlanID: {
          in: memberPlanIds,
        },
      };
    }
    return this.prisma.subscription.findMany({
      select: {
        id: true,
        replacesSubscriptionID: true,
        user: {
          select: {
            id: true,
            firstName: true,
            name: true,
            email: true,
          },
        },
      },
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
        paidUntil: {
          not: null,
        },
        ...memberPlanFilter,
      },
    });
  }

  private async getDailyDeactivatedSubscriptions(
    date: Date,
    memberPlanIds: string[] = []
  ) {
    if (date > new Date(new Date().getTime() + 24 * 60 * 60 * 1000)) {
      return [];
    }

    // Since the subscription is running until end of paidUntil; we need to subtract one day to ensure to count the ones who have been deactivated and paid until is yesterday
    const start = startOfDay(date);
    const end = endOfDay(date);

    let memberPlanFilter: Prisma.SubscriptionWhereInput = {};
    if (memberPlanIds.length > 0) {
      memberPlanFilter = {
        memberPlanID: {
          in: memberPlanIds,
        },
      };
    }

    return this.prisma.subscription.findMany({
      select: {
        id: true,
        user: {
          select: {
            id: true,
            firstName: true,
            name: true,
            email: true,
          },
        },
      },
      where: {
        deactivation: {
          date: {
            gte: start,
            lte: end,
          },
        },
        paidUntil: {
          not: null,
        },
        ...memberPlanFilter,
      },
    });
  }

  private getDailyOverdueSubscriptions(
    date: Date,
    memberPlanIds: string[] = []
  ) {
    if (date > new Date(new Date().getTime() + 24 * 60 * 60 * 1000)) {
      return [];
    }

    const yesterday = subDays(date, 1);
    const startYesterday = startOfDay(yesterday);
    const endYesterday = endOfDay(yesterday);
    let memberPlanFilter: Prisma.SubscriptionWhereInput = {};
    if (memberPlanIds.length > 0) {
      memberPlanFilter = {
        memberPlanID: {
          in: memberPlanIds,
        },
      };
    }
    return this.prisma.subscription.findMany({
      select: {
        id: true,
        user: {
          select: {
            id: true,
            firstName: true,
            name: true,
            email: true,
          },
        },
      },
      where: {
        paidUntil: {
          not: null,
          lte: endYesterday,
          gte: startYesterday,
        },
        deactivation: null,
        ...memberPlanFilter,
      },
    });
  }

  private async getDailyRenewedSubscriptions(
    date: Date,
    memberPlanIds: string[] = []
  ) {
    if (date > new Date(new Date().getTime() + 24 * 60 * 60 * 1000)) {
      return [];
    }

    const start = startOfDay(date);
    const end = endOfDay(date);
    let memberPlanFilter: Prisma.SubscriptionWhereInput = {};
    if (memberPlanIds.length > 0) {
      memberPlanFilter = {
        memberPlanID: {
          in: memberPlanIds,
        },
      };
    }
    return this.prisma.subscription.findMany({
      select: {
        id: true,
        user: {
          select: {
            id: true,
            firstName: true,
            name: true,
            email: true,
          },
        },
      },
      where: {
        paidUntil: {
          not: null,
          gte: end,
        },
        // Ensure that it is not the initial creation
        createdAt: {
          not: {
            gte: start,
          },
        },
        // Ensure that the new period starts today
        periods: {
          some: {
            startsAt: {
              gte: start,
              lte: end,
            },
          },
        },
        ...memberPlanFilter,
      },
    });
  }

  private async getDailyTotalActiveSubscriptionCount(
    date: Date,
    memberPlanIds: string[] = []
  ) {
    const end = endOfDay(date);
    let memberPlanFilter: Prisma.SubscriptionWhereInput = {};
    if (memberPlanIds.length > 0) {
      memberPlanFilter = {
        memberPlanID: {
          in: memberPlanIds,
        },
      };
    }
    return this.prisma.subscription.count({
      where: {
        paidUntil: {
          gte: end,
        },
        createdAt: {
          lte: end,
        },
        ...memberPlanFilter,
      },
    });
  }

  private async getDailyPredictedSubscriptionRenewals(
    date: Date,
    memberPlanIds: string[] = []
  ) {
    if (date < new Date()) {
      return [];
    }

    const start = startOfDay(date);
    const end = endOfDay(date);

    let memberPlanFilter: Prisma.SubscriptionWhereInput = {};
    if (memberPlanIds.length > 0) {
      memberPlanFilter = {
        memberPlanID: {
          in: memberPlanIds,
        },
      };
    }

    return await this.prisma.subscription.findMany({
      select: {
        id: true,
        user: {
          select: {
            id: true,
            firstName: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: { periods: true },
        },
      },
      where: {
        paidUntil: {
          gte: start,
          lte: end,
        },
        autoRenew: true,
        deactivation: null,
        ...memberPlanFilter,
      },
    });
  }

  private async getDailySummarizedPredictedSubscriptionRenewals(
    date: Date,
    memberPlanIds: string[] = [],
    fromDate: Date
  ) {
    if (date < new Date()) {
      return [];
    }

    if (fromDate < new Date()) {
      fromDate = new Date();
    }

    const start = startOfDay(fromDate);
    const end = endOfDay(date);

    let memberPlanFilter: Prisma.SubscriptionWhereInput = {};
    if (memberPlanIds.length > 0) {
      memberPlanFilter = {
        memberPlanID: {
          in: memberPlanIds,
        },
      };
    }

    return await this.prisma.subscription.findMany({
      select: {
        id: true,
        _count: {
          select: { periods: true },
        },
      },
      where: {
        paidUntil: {
          gte: start,
          lte: end,
        },
        autoRenew: true,
        deactivation: null,
        ...memberPlanFilter,
      },
    });
  }

  private async getDailyEndingSubscriptions(
    date: Date,
    memberPlanIds: string[] = []
  ) {
    if (date < new Date()) {
      return [];
    }

    const start = startOfDay(date);
    const end = endOfDay(date);
    let memberPlanFilter: Prisma.SubscriptionWhereInput = {};
    if (memberPlanIds.length > 0) {
      memberPlanFilter = {
        memberPlanID: {
          in: memberPlanIds,
        },
      };
    }

    return this.prisma.subscription.findMany({
      select: {
        id: true,
        user: {
          select: {
            id: true,
            firstName: true,
            name: true,
            email: true,
          },
        },
      },
      where: {
        deactivation: null,
        autoRenew: false,
        paidUntil: {
          gte: start,
          lte: end,
        },
        ...memberPlanFilter,
      },
    });
  }

  private getCacheTTLByDate(date: Date) {
    const now = new Date();
    const daysBetween = differenceInDays(now, date);

    // 14 Tage max cache duration 14 * 24h
    const cappedDays = Math.min(daysBetween, 336);

    // +1 to ensure its never 0 this means cache for ever
    // First day is cached for 1 sec (min) every day (live); In the past every day is cached for 60 min longer than the previous limited by 14 days
    // eg. 3 day in the past (3 * 3600) + 1 sec
    return cappedDays * ONE_HOUR_IN_SEC + 1;
  }

  async generateDailyData(
    current: Date,
    sortedPlanIds: string[],
    fromDate: Date
  ): Promise<DailySubscriptionStats> {
    const [
      totalActiveSubscriptionCount,
      createdSubscriptions,
      renewedSubscriptions,
      deactivatedSubscriptions,
      dailyOverdueSubscriptions,
      dailySummarizedPredictedSubscriptionRenewals,
      dailyPredictedSubscriptionRenewals,
      dailyEndingSubscriptions,
    ] = await Promise.all([
      this.getDailyTotalActiveSubscriptionCount(current, sortedPlanIds),
      this.getDailyCreatedSubscriptions(current, sortedPlanIds),
      this.getDailyRenewedSubscriptions(current, sortedPlanIds),
      this.getDailyDeactivatedSubscriptions(current, sortedPlanIds),
      this.getDailyOverdueSubscriptions(current, sortedPlanIds),
      this.getDailySummarizedPredictedSubscriptionRenewals(
        current,
        sortedPlanIds,
        fromDate
      ),
      this.getDailyPredictedSubscriptionRenewals(current, sortedPlanIds),
      this.getDailyEndingSubscriptions(current, sortedPlanIds),
    ]);

    const replacedSubscriptions = createdSubscriptions.filter(
      createdSubscription => createdSubscription.replacesSubscriptionID
    );

    const summarizedHighProbabilityRenewals =
      dailySummarizedPredictedSubscriptionRenewals.filter(subscription =>
        gt(subscription._count.periods, 1)
      );

    const summarizedLowProbabilityRenewals =
      dailySummarizedPredictedSubscriptionRenewals.filter(
        subscription => !gt(subscription._count.periods, 1)
      );

    const highProbabilityRenewals = dailyPredictedSubscriptionRenewals.filter(
      subscription => gt(subscription._count.periods, 1)
    );

    const lowProbabilityRenewals = dailyPredictedSubscriptionRenewals.filter(
      subscription => !gt(subscription._count.periods, 1)
    );

    return {
      date: format(current, 'yyyy-MM-dd'),
      totalActiveSubscriptionCount,
      createdSubscriptionCount: createdSubscriptions.length,
      createdSubscriptionUsers: createdSubscriptions.map(
        createdSubscription => {
          const user =
            createdSubscription.user as typeof createdSubscription.user & {
              subscriptionID: string;
            };
          user.subscriptionID = createdSubscription.id;
          return user;
        }
      ),
      overdueSubscriptionCount: dailyOverdueSubscriptions.length,
      overdueSubscriptionUsers: dailyOverdueSubscriptions.map(
        createdSubscription => {
          const user =
            createdSubscription.user as typeof createdSubscription.user & {
              subscriptionID: string;
            };
          user.subscriptionID = createdSubscription.id;
          return user;
        }
      ),

      replacedSubscriptionCount: replacedSubscriptions.length,
      replacedSubscriptionUsers: replacedSubscriptions.map(
        replacedSubscription => {
          const user =
            replacedSubscription.user as typeof replacedSubscription.user & {
              subscriptionID: string;
            };
          user.subscriptionID = replacedSubscription.id;
          return user;
        }
      ),

      renewedSubscriptionCount: renewedSubscriptions.length,
      renewedSubscriptionUsers: renewedSubscriptions.map(
        renewedSubscription => {
          const user =
            renewedSubscription.user as typeof renewedSubscription.user & {
              subscriptionID: string;
            };
          user.subscriptionID = renewedSubscription.id;
          return user;
        }
      ),

      deactivatedSubscriptionCount: deactivatedSubscriptions.length,
      deactivatedSubscriptionUsers: deactivatedSubscriptions.map(
        deactivatedSubscription => {
          const user =
            deactivatedSubscription.user as typeof deactivatedSubscription.user & {
              subscriptionID: string;
            };
          user.subscriptionID = deactivatedSubscription.id;
          return user;
        }
      ),

      predictedSubscriptionRenewalCount: {
        high: summarizedHighProbabilityRenewals.length,
        low: summarizedLowProbabilityRenewals.length,
        total: dailySummarizedPredictedSubscriptionRenewals.length,
        perDayHighProbability: highProbabilityRenewals.length,
        perDayLowProbability: lowProbabilityRenewals.length,
      },
      predictedSubscriptionRenewalUsersHighProbability:
        highProbabilityRenewals.map(predictedSubscription => {
          const user =
            predictedSubscription.user as typeof predictedSubscription.user & {
              subscriptionID: string;
            };
          user.subscriptionID = predictedSubscription.id;
          return user;
        }),
      predictedSubscriptionRenewalUsersLowProbability:
        lowProbabilityRenewals.map(predictedSubscription => {
          const user =
            predictedSubscription.user as typeof predictedSubscription.user & {
              subscriptionID: string;
            };
          user.subscriptionID = predictedSubscription.id;
          return user;
        }),

      endingSubscriptionCount: dailyEndingSubscriptions.length,
      endingSubscriptionUsers: dailyEndingSubscriptions.map(
        endingSubscription => {
          const user =
            endingSubscription.user as typeof endingSubscription.user & {
              subscriptionID: string;
            };
          user.subscriptionID = endingSubscription.id;
          return user;
        }
      ),
    };
  }

  async dailySubscriptionStats(
    start: Date,
    end: Date,
    memberPlanIds: string[]
  ): Promise<DailySubscriptionStats[]> {
    let current = new Date(start);
    const sortedPlanIds = memberPlanIds.sort();

    current = endOfDay(current);
    end = endOfDay(end);

    const memberPlans = await this.prisma.memberPlan.findMany({
      where: {
        id: {
          in: sortedPlanIds,
        },
      },
    });

    if (memberPlans.length !== sortedPlanIds.length) {
      throw new NotFoundException(`Selected member plan not found!`);
    }

    // Ensure start is not after end
    if (end < start) {
      end = start;
    }

    const dates: Date[] = [];
    const temp = new Date(current);
    while (temp <= end) {
      dates.push(new Date(temp)); // clone to avoid mutation
      temp.setDate(temp.getDate() + 1);
    }

    // Parallelize data building
    const results = await Promise.all(
      dates.map(async date => {
        const cacheKey = createHash('sha256')
          .update(`${date.toISOString()}-${JSON.stringify(sortedPlanIds)}`)
          .digest('hex');

        if (dailyStatsCache.has(cacheKey)) {
          return dailyStatsCache.get(cacheKey) as DailySubscriptionStats;
        }

        const stats = await this.generateDailyData(date, sortedPlanIds, start);
        dailyStatsCache.set(cacheKey, stats, this.getCacheTTLByDate(date));
        return stats;
      })
    );
    return results;
  }
}
