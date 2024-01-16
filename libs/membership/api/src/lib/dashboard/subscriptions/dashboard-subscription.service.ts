import {Injectable} from '@nestjs/common'
import {PrismaClient} from '@prisma/client'
import {ok} from 'assert'
import {DashboardSubscription} from './dashboard-subscription.model'

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
}
