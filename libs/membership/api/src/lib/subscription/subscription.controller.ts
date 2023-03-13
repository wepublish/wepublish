import {OldContextService, PrismaService} from '@wepublish/api'
import {
  Subscription,
  SubscriptionDeactivation,
  SubscriptionPeriod,
  User,
  PaymentMethod,
  MemberPlan,
  PaymentPeriodicity
} from '@prisma/client'
import {add} from 'date-fns'

export type SubscriptionControllerConfig = {
  subscription: Subscription
}

class SubscriptionController {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly oldContextService: OldContextService,
    private readonly config: SubscriptionControllerConfig
  ) {}

  public async createInvoices() {
    this.config.subscription
  }

  private async getSubscriptionsForInvoiceCreation(
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
        periods: {
          none: {
            startsAt: {
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

  private createInvoice(
    subscription: Subscription & {
      periods: SubscriptionPeriod[]
      deactivation: SubscriptionDeactivation | null
      user: User
      paymentMethod: PaymentMethod
      memberPlan: MemberPlan
    }
  ) {
    const amount = subscription.monthlyAmount * this.getMonthCount(subscription.paymentPeriodicity)
    const description = `Renewal of subscription ${subscription.memberPlan.name} for ${subscription.paymentPeriodicity}`
    return this.prismaService.invoice.create({
      data: {
        mail: subscription.user.email,
        dueAt: subscription.paidUntil || '',
        description,
        items: {
          create: {
            name: `${subscription.memberPlan.name}`,
            description,
            quantity: 1,
            amount
          }
        },
        subscriptionPeriods: {
          create: {
            startsAt: new Date(),
            endsAt: new Date(),
            paymentPeriodicity: subscription.paymentPeriodicity,
            amount,
            subscription: {
              connect: {
                id: subscription.id
              }
            }
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
