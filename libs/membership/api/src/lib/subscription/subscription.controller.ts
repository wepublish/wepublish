import {OldContextService, PrismaService} from '@wepublish/api'
import {
  Subscription,
  SubscriptionDeactivation,
  SubscriptionPeriod,
  User,
  PaymentMethod,
  MemberPlan,
  PaymentPeriodicity,
  SubscriptionEvent
} from '@prisma/client'
import {add, addDays} from 'date-fns'
import {Injectable} from '@nestjs/common'
import {Action} from '../subscription-event-dictionary/subscription-event-dictionary.type'

export type SubscriptionControllerConfig = {
  subscription: Subscription
}

@Injectable()
export class SubscriptionController {
  constructor(private readonly prismaService: PrismaService) {}

  public async getSubscriptionsForInvoiceCreation(
    runDate: Date,
    closestRenewalDate: Date
  ): Promise<
    (Subscription & {
      periods: SubscriptionPeriod[]
      deactivation: SubscriptionDeactivation | null
      user: User
      paymentMethod: PaymentMethod
      memberPlan: MemberPlan
    })[]
  > {
    return await this.prismaService.subscription.findMany({
      where: {
        paidUntil: {
          lte: closestRenewalDate
        },
        deactivation: {
          is: null
        },
        invoices: {
          none: {
            dueAt: {
              gte: runDate
            }
          }
        },
        autoRenew: true
      },
      include: {
        periods: true,
        deactivation: true,
        user: true,
        paymentMethod: true,
        memberPlan: true
      }
    })
  }

  public async getInvoicesToCharge(runDate: Date) {
    return this.prismaService.invoice.findMany({
      where: {
        dueAt: {
          lte: runDate
        },
        canceledAt: null,
        paidAt: null
      },
      include: {
        subscription: true,
        user: true,
        subscriptionPeriods: true
      }
    })
  }

  public async getSubscriptionsToDeactivate(runDate: Date) {
    return this.prismaService.invoice.findMany({
      where: {
        paymentDeadline: {
          lte: runDate
        },
        canceledAt: null,
        paidAt: null
      },
      include: {
        subscription: true,
        user: true,
        subscriptionPeriods: true
      }
    })
  }

  private getMonthCount(periodicity: PaymentPeriodicity) {
    switch (periodicity) {
      case PaymentPeriodicity.monthly:
        return 1
      case PaymentPeriodicity.quarterly:
        return 3
      case PaymentPeriodicity.biannual:
        return 6
      case PaymentPeriodicity.yearly:
        return 12
      default:
        throw Error(`Enum for PaymentPeriodicity ${periodicity} not defined!`)
    }
  }

  private getPeriodStarEnd(periods: SubscriptionPeriod[], periodicity: PaymentPeriodicity) {
    if (periods.length === 0) {
      return {
        startsAt: add(new Date(), {days: 1}),
        endsAt: add(new Date(), {months: this.getMonthCount(periodicity)})
      }
    }
    const latestPeriod = periods.reduce(function (prev, current) {
      return prev.endsAt > current.endsAt ? prev : current
    })
    return {
      startsAt: add(latestPeriod.endsAt, {days: 1}),
      endsAt: add(latestPeriod.endsAt, {months: this.getMonthCount(periodicity)})
    }
  }

  public async createInvoice(
    subscription: Subscription & {
      periods: SubscriptionPeriod[]
      deactivation: SubscriptionDeactivation | null
      user: User
      paymentMethod: PaymentMethod
      memberPlan: MemberPlan
    },
    paymentDeadline: Action
  ) {
    const amount = subscription.monthlyAmount * this.getMonthCount(subscription.paymentPeriodicity)
    const description = `Renewal of subscription ${subscription.memberPlan.name} for ${subscription.paymentPeriodicity}`

    return this.prismaService.invoice.create({
      data: {
        mail: subscription.user.email,
        dueAt: subscription.paidUntil || new Date(),
        description,
        items: {
          create: {
            name: `${subscription.memberPlan.name}`,
            description,
            quantity: 1,
            amount
          }
        },
        paymentDeadline: add(subscription.paidUntil || new Date(), {
          days: paymentDeadline.daysAwayFromEnding || undefined
        }),
        subscriptionPeriods: {
          create: {
            paymentPeriodicity: subscription.paymentPeriodicity,
            amount,
            subscription: {
              connect: {
                id: subscription.id
              }
            },
            ...this.getPeriodStarEnd(subscription.periods, subscription.paymentPeriodicity)
          }
        },
        subscription: {
          connect: {
            id: subscription.id
          }
        },
        user: {
          connect: {
            id: subscription.user.id
          }
        }
      }
    })
  }
  private async markInvoiceAsPaid(
    subscription: Subscription & {
      periods: SubscriptionPeriod[]
      deactivation: SubscriptionDeactivation | null
      user: User
      paymentMethod: PaymentMethod
      memberPlan: MemberPlan
    }
  ) {
    const newPaidUntil = add(subscription.paidUntil || subscription.createdAt, {
      months: this.getMonthCount(subscription.paymentPeriodicity)
    })
    await this.prismaService.$transaction([
      this.prismaService.subscription.update({
        where: {
          id: subscription.id
        },
        data: {
          paidUntil: newPaidUntil
        }
      }),
      this.prismaService.invoice.update({
        where: {
          id: subscription.id
        },
        data: {
          paidAt: new Date()
        }
      })
    ])
  }
}
