import {Injectable, NotFoundException} from '@nestjs/common'
import {PaymentState, Prisma, PrismaClient} from '@prisma/client'
import {ok} from 'assert'
import {DailySubscriptionStats, DashboardSubscription} from './dashboard-subscription.model'
import {differenceInDays, endOfDay, startOfDay} from 'date-fns'
import NodeCache from 'node-cache'
import {createHash} from 'crypto'

/**
 * Peered article cache configuration and setup
 */
const ONE_MIN_IN_SEC = 60
const dailyStatsCache = new NodeCache({
  checkperiod: ONE_MIN_IN_SEC,
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

  private async getDailyRevenue(date: Date, memberPlanIds: string[] = []) {
    const start = startOfDay(date)
    const end = endOfDay(date)
    let memberPlanFilter: Prisma.InvoiceWhereInput = {}
    if (memberPlanIds.length > 0) {
      memberPlanFilter = {
        subscription: {
          memberPlanID: {
            in: memberPlanIds
          }
        }
      }
    }
    const invoices = await this.prisma.invoice.findMany({
      select: {
        items: {
          select: {
            amount: true
          }
        }
      },
      where: {
        paidAt: {
          gte: start,
          lte: end
        },
        ...memberPlanFilter
      }
    })
    return invoices.reduce((invoiceSum, invoice) => {
      const itemsSum = invoice.items.reduce((itemSum, item) => itemSum + item.amount, 0)
      return invoiceSum + itemsSum
    }, 0)
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

  private getUnpaidCreatedSubscriptions(date: Date, memberPlanIds: string[] = []) {
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
        paidUntil: null,
        createdAt: {
          gte: start,
          lte: end
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

  private async getDailyTotalActiveSubscriptions(date: Date, memberPlanIds: string[] = []) {
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
        monthlyAmount: true,
        startsAt: true,
        paidUntil: true
      },
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

  private getCacheTTLByDate(date: Date) {
    const now = new Date()
    const daysBetween = differenceInDays(now, date)
    // 14 Tage max cache duration 14 * 60
    const cappedDays = Math.min(daysBetween, 336)
    const secondsPerDay = 60 * 60
    // +1 to ensure its never 0 this means cache for ever
    return cappedDays * secondsPerDay + 1
  }

  private calculateDailyActiveSubscriptionStats(
    activeSubscriptions: {monthlyAmount: number; startsAt: Date; paidUntil: Date | null}[]
  ) {
    let subscriptionMonthlyRevenueSum = 0
    let subscriptionDurationInDaysSum = 0
    for (const activeSubscription of activeSubscriptions) {
      subscriptionMonthlyRevenueSum += activeSubscription.monthlyAmount
      if (activeSubscription.paidUntil) {
        subscriptionDurationInDaysSum += differenceInDays(
          activeSubscription.paidUntil,
          activeSubscription.startsAt
        )
      }
    }
    return {
      subscriptionMonthlyRevenueSum,
      subscriptionMonthlyRevenueAvg: Math.ceil(
        subscriptionMonthlyRevenueSum / activeSubscriptions.length
      ),
      subscriptionDurationAvg: Math.ceil(subscriptionDurationInDaysSum / activeSubscriptions.length)
    }
  }

  async generateDailyData(current: Date, sortedPlanIds: string[]): Promise<DailySubscriptionStats> {
    const [
      totalActiveSubscriptions,
      createdSubscriptions,
      renewedSubscriptions,
      deactivatedSubscriptions,
      createdUnpaidSubscriptions,
      subscriptionDailyRevenue
    ] = await Promise.all([
      this.getDailyTotalActiveSubscriptions(current, sortedPlanIds),
      this.getDailyCreatedSubscriptions(current, sortedPlanIds),
      this.getDailyRenewedSubscriptions(current, sortedPlanIds),
      this.getDailyDeactivatedSubscriptions(current, sortedPlanIds),
      this.getUnpaidCreatedSubscriptions(current, sortedPlanIds),
      this.getDailyRevenue(current, sortedPlanIds)
    ])

    const replacedSubscriptions = createdSubscriptions.filter(
      createdSubscription => createdSubscription.replacesSubscriptionID
    )

    const {subscriptionMonthlyRevenueAvg, subscriptionMonthlyRevenueSum, subscriptionDurationAvg} =
      this.calculateDailyActiveSubscriptionStats(totalActiveSubscriptions)

    return {
      date: new Date(current).toISOString().split('T')[0],
      totalActiveSubscriptionCount: totalActiveSubscriptions.length,
      createdSubscriptionCount: createdSubscriptions.length,
      createdSubscriptionUsers: createdSubscriptions.map(
        createdSubscription => createdSubscription.user
      ),
      createdUnpaidSubscriptionCount: createdUnpaidSubscriptions.length,
      createdUnpaidSubscriptionUsers: createdUnpaidSubscriptions.map(
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
      ),
      subscriptionMonthlyRevenueAvg,
      subscriptionMonthlyRevenueSum,
      subscriptionDailyRevenue,
      subscriptionDurationAvg
    }
  }

  async dailySubscriptionStats(
    start: Date,
    end: Date,
    memberPlanIds: string[]
  ): Promise<DailySubscriptionStats[]> {
    let current = new Date(start)
    const sortedPlanIds = memberPlanIds.sort()

    current = endOfDay(current)
    end = endOfDay(end)

    const memberPlans = await this.prisma.memberPlan.findMany({
      where: {
        id: {
          in: sortedPlanIds
        }
      }
    })

    if (memberPlans.length !== sortedPlanIds.length) {
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

    const dates: Date[] = []
    let temp = new Date(current)
    while (temp <= end) {
      dates.push(new Date(temp)) // clone to avoid mutation
      temp.setDate(temp.getDate() + 1)
    }

    // Parallelize data building
    const results = await Promise.all(
      dates.map(async date => {
        const cacheKey = createHash('sha256')
          .update(`${date.toISOString()}-${JSON.stringify(sortedPlanIds)}`)
          .digest('hex')

        if (dailyStatsCache.has(cacheKey)) {
          return dailyStatsCache.get(cacheKey) as DailySubscriptionStats
        }

        const stats = await this.generateDailyData(date, sortedPlanIds)
        dailyStatsCache.set(cacheKey, stats, this.getCacheTTLByDate(date))
        return stats
      })
    )
    return results
  }
}
