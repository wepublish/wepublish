import {Injectable, NotFoundException} from '@nestjs/common'
import {Prisma, PrismaClient} from '@prisma/client'
import {ok} from 'assert'
import {DailySubscriptionStats, DashboardSubscription} from './dashboard-subscription.model'
import {endOfDay, startOfDay} from 'date-fns'
import NodeCache from 'node-cache'
import {createHash} from 'crypto'

/**
 * Peered article cache configuration and setup
 */
const ONE_DAY_IN_SEC = 24 * 60 * 60
const ONE_MIN_IN_SEC = 60
const dailyStatsCache = new NodeCache({
  stdTTL: 2 * ONE_DAY_IN_SEC,
  checkperiod: 60 * ONE_MIN_IN_SEC,
  deleteOnExpire: true,
  useClones: true
})

@Injectable()
export class DashboardSubscriptionService {
  constructor(private prisma: PrismaClient) {}

  async newSubscribers(start: Date, end: Date): Promise<DashboardSubscription[]> {
    const data = await this.prisma.subscription.findMany({
      where: {
        startsAt: {
          gte: start,
          lt: end
        }
      },
      orderBy: {
        startsAt: 'desc'
      },
      include: {
        deactivation: true,
        memberPlan: {
          select: {
            name: true
          }
        }
      }
    })

    return data.map(
      ({
        autoRenew,
        paidUntil,
        monthlyAmount,
        startsAt,
        deactivation,
        paymentPeriodicity,
        memberPlan: {name: memberPlan}
      }) => ({
        startsAt,
        endsAt: deactivation?.date ?? ((autoRenew && paidUntil) || undefined),
        renewsAt: (autoRenew && paidUntil) || undefined,
        monthlyAmount,
        paymentPeriodicity,
        reasonForDeactivation: deactivation?.reason,
        deactivationDate: deactivation?.createdAt,
        memberPlan
      })
    )
  }

  async activeSubscribers(): Promise<DashboardSubscription[]> {
    const data = await this.prisma.subscription.findMany({
      where: {
        OR: [
          {
            deactivation: null,
            paidUntil: {
              gte: new Date()
            }
          },
          {
            deactivation: {
              date: {
                gte: new Date()
              }
            }
          }
        ]
      },
      orderBy: {
        startsAt: 'desc'
      },
      include: {
        deactivation: true,
        memberPlan: {
          select: {
            name: true
          }
        }
      }
    })

    return data.map(
      ({
        autoRenew,
        paidUntil,
        monthlyAmount,
        startsAt,
        deactivation,
        paymentPeriodicity,
        memberPlan: {name: memberPlan}
      }) => ({
        startsAt,
        endsAt: deactivation?.date ?? ((autoRenew && paidUntil) || undefined),
        renewsAt: (autoRenew && paidUntil) || undefined,
        monthlyAmount,
        paymentPeriodicity,
        reasonForDeactivation: deactivation?.reason,
        deactivationDate: deactivation?.createdAt,
        memberPlan
      })
    )
  }

  async renewingSubscribers(start: Date, end: Date): Promise<DashboardSubscription[]> {
    const data = await this.prisma.subscription.findMany({
      where: {
        paidUntil: {
          gte: start,
          lt: end
        },
        autoRenew: true,
        deactivation: null
      },
      orderBy: {
        paidUntil: 'desc'
      },
      include: {
        memberPlan: {
          select: {
            name: true
          }
        }
      }
    })

    return data.map(
      ({
        monthlyAmount,
        startsAt,
        paidUntil,
        paymentPeriodicity,
        memberPlan: {name: memberPlan}
      }) => {
        ok(paidUntil)

        return {
          startsAt,
          renewsAt: paidUntil,
          monthlyAmount,
          paymentPeriodicity,
          memberPlan
        }
      }
    )
  }

  async newDeactivations(start: Date, end: Date): Promise<DashboardSubscription[]> {
    const data = await this.prisma.subscription.findMany({
      where: {
        deactivation: {
          createdAt: {
            gte: start,
            lt: end
          }
        }
      },
      orderBy: {
        deactivation: {
          createdAt: 'desc'
        }
      },
      include: {
        deactivation: true,
        memberPlan: {
          select: {
            name: true
          }
        }
      }
    })

    return data.map(
      ({
        memberPlan: {name: memberPlan},
        monthlyAmount,
        deactivation,
        startsAt,
        paymentPeriodicity
      }) => {
        ok(deactivation)

        return {
          startsAt,
          endsAt: deactivation.date,
          reasonForDeactivation: deactivation.reason,
          deactivationDate: deactivation.createdAt,
          paymentPeriodicity,
          monthlyAmount,
          memberPlan
        }
      }
    )
  }

  private async getDailyCreatedSubscriptions(date: Date, memberPlanIds: string[] = []) {
    const start = startOfDay(date)
    const end = endOfDay(date)
    let memberPlanFilter: Prisma.SubscriptionWhereInput = {}
    if (memberPlanIds.length > 0) {
      memberPlanFilter = {
        memberPlanID: {
          in: memberPlanIds
        }
      }
    }
    return this.prisma.subscription.findMany({
      select: {
        replacesSubscriptionID: true,
        user: {
          select: {
            id: true,
            firstName: true,
            name: true,
            email: true
          }
        }
      },
      where: {
        createdAt: {
          gte: start,
          lte: end
        },
        paidUntil: {
          not: null
        },
        ...memberPlanFilter
      }
    })
  }

  private async getDailyDeactivatedSubscriptions(date: Date, memberPlanIds: string[] = []) {
    // Since the subscription is running until end of paidUntil; we need to subtract one day to ensure to count the ones who have been deactivated and paid until is yesterday
    const start = startOfDay(date)
    const end = endOfDay(date)

    let memberPlanFilter: Prisma.SubscriptionWhereInput = {}
    if (memberPlanIds.length > 0) {
      memberPlanFilter = {
        memberPlanID: {
          in: memberPlanIds
        }
      }
    }

    return this.prisma.subscription.findMany({
      select: {
        user: {
          select: {
            id: true,
            firstName: true,
            name: true,
            email: true
          }
        }
      },
      where: {
        deactivation: {
          date: {
            gte: start,
            lte: end
          }
        },
        paidUntil: {
          not: null
        },
        ...memberPlanFilter
      }
    })
  }

  private async getDailyRenewedSubscriptions(date: Date, memberPlanIds: string[] = []) {
    const start = startOfDay(date)
    const end = endOfDay(date)
    let memberPlanFilter: Prisma.SubscriptionWhereInput = {}
    if (memberPlanIds.length > 0) {
      memberPlanFilter = {
        memberPlanID: {
          in: memberPlanIds
        }
      }
    }
    return this.prisma.subscription.findMany({
      select: {
        user: {
          select: {
            id: true,
            firstName: true,
            name: true,
            email: true
          }
        }
      },
      where: {
        paidUntil: {
          not: null
        },
        // Ensure that it is not the initial creation
        createdAt: {
          not: {
            gte: start
          }
        },
        // Ensure that the new period starts today
        periods: {
          some: {
            startsAt: {
              gte: start,
              lte: end
            }
          }
        },
        ...memberPlanFilter
      }
    })
  }

  private async getDailyTotalActiveSubscriptionCount(date: Date, memberPlanIds: string[] = []) {
    const end = endOfDay(date)
    let memberPlanFilter: Prisma.SubscriptionWhereInput = {}
    if (memberPlanIds.length > 0) {
      memberPlanFilter = {
        memberPlanID: {
          in: memberPlanIds
        }
      }
    }
    return this.prisma.subscription.count({
      where: {
        OR: [
          {
            createdAt: {
              lte: end
            },
            paidUntil: {
              not: null
            },
            deactivation: {
              is: null
            }
          },
          {
            createdAt: {
              lte: end
            },
            paidUntil: {
              not: null
            },
            deactivation: {
              date: {
                gte: end
              }
            }
          }
        ],
        ...memberPlanFilter
      }
    })
  }

  async dailySubscriptionStats(
    start: Date,
    end: Date,
    memberPlanIds: string[]
  ): Promise<DailySubscriptionStats[]> {
    const returnValue: DailySubscriptionStats[] = []
    let current = new Date(start)

    current = endOfDay(current)
    end = endOfDay(end)

    const memberPlans = await this.prisma.memberPlan.findMany({
      where: {
        id: {
          in: memberPlanIds
        }
      }
    })

    if (memberPlans.length !== memberPlanIds.length) {
      throw new NotFoundException(`Selected member plan not found!`)
    }

    // Ensure start is not after end
    if (end < start) {
      end = start
    }

    // Ensure end is not in the future since data from future is not supported
    if (end > new Date()) {
      end = endOfDay(new Date())
    }

    while (current <= end) {
      const cacheKey = createHash('sha256')
        .update(`${current.toISOString()}-${JSON.stringify(memberPlanIds)}`)
        .digest('hex')

      // Serve all past days from cache but serve today fresh
      if (current.getTime() !== endOfDay(new Date()).getTime() && dailyStatsCache.has(cacheKey)) {
        returnValue.push(dailyStatsCache.get(cacheKey) as DailySubscriptionStats)
        current.setDate(current.getDate() + 1)
        continue
      }

      const totalActiveSubscriptionCount = await this.getDailyTotalActiveSubscriptionCount(
        current,
        memberPlanIds
      )
      const createdSubscriptions = await this.getDailyCreatedSubscriptions(current, memberPlanIds)
      const renewedSubscriptions = await this.getDailyRenewedSubscriptions(current, memberPlanIds)
      const deactivatedSubscriptions = await this.getDailyDeactivatedSubscriptions(
        current,
        memberPlanIds
      )

      const replacedSubscriptions = createdSubscriptions.filter(
        createdSubscription => createdSubscription.replacesSubscriptionID
      )

      const stats: DailySubscriptionStats = {
        date: new Date(current).toISOString().split('T')[0],
        totalActiveSubscriptionCount,
        createdSubscriptionCount: createdSubscriptions.length,
        createdSubscriptionUsers: createdSubscriptions.map(
          createdSubscription => createdSubscription.user
        ),

        replacedSubscriptionCount: replacedSubscriptions.length,
        replacedSubscriptionUsers: replacedSubscriptions.map(
          replacedSubscription => replacedSubscription.user
        ),

        renewedSubscriptionCount: renewedSubscriptions.length,
        renewedSubscriptionUsers: renewedSubscriptions.map(
          renewedSubscription => renewedSubscription.user
        ),

        deactivatedSubscriptionCount: deactivatedSubscriptions.length,
        deactivatedSubscriptionUsers: deactivatedSubscriptions.map(
          deactivatedSubscription => deactivatedSubscription.user
        )
      }

      dailyStatsCache.set(cacheKey, stats)
      returnValue.push(stats)

      current.setDate(current.getDate() + 1)
    }
    return returnValue
  }
}
