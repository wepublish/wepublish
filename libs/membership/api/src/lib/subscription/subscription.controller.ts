import {OldContextService, PaymentProvider, PrismaService} from '@wepublish/api'
import {
  Invoice,
  Subscription,
  SubscriptionDeactivation,
  SubscriptionPeriod,
  User,
  PaymentMethod,
  MemberPlan,
  PaymentPeriodicity,
  SubscriptionEvent,
  SubscriptionDeactivationReason,
  PaymentProviderCustomer,
  PaymentState,
  InvoiceItem
} from '@prisma/client'
import {add, endOfDay, startOfDay, sub} from 'date-fns'
import {Injectable, Logger} from '@nestjs/common'
import {Action} from '../subscription-event-dictionary/subscription-event-dictionary.type'

export type SubscriptionControllerConfig = {
  subscription: Subscription
}

@Injectable()
export class SubscriptionController {
  private readonly logger = new Logger('SubscriptionController')
  constructor(
    private readonly prismaService: PrismaService,
    private readonly oldContextService: OldContextService
  ) {}

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
          lte: endOfDay(closestRenewalDate)
        },
        deactivation: {
          is: null
        },
        invoices: {
          none: {
            paymentDeadline: {
              gte: sub(endOfDay(runDate), {days: 3})
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
          lte: endOfDay(runDate)
        },
        canceledAt: null,
        paidAt: null
      },
      include: {
        subscription: {
          include: {
            paymentMethod: true,
            memberPlan: true,
            user: {
              include: {
                paymentProviderCustomers: true
              }
            }
          }
        },
        subscriptionPeriods: true,
        items: true
      }
    })
  }

  public async getSubscriptionsToDeactivate(runDate: Date) {
    return this.prismaService.invoice.findMany({
      where: {
        paymentDeadline: {
          lte: startOfDay(runDate)
        },
        canceledAt: null,
        paidAt: null
      },
      include: {
        subscription: {
          include: {
            user: true
          }
        },
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
        throw new Error(`Enum for PaymentPeriodicity ${periodicity} not defined!`)
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
      user: User
      memberPlan: MemberPlan
    },
    paymentDeadline: Action
  ) {
    if (paymentDeadline.type !== SubscriptionEvent.DEACTIVATION_UNPAID) {
      throw new Error(
        `Given action has not right type! ${paymentDeadline.type} should never happen!`
      )
    }

    const amount = subscription.monthlyAmount * this.getMonthCount(subscription.paymentPeriodicity)
    const description = `${subscription.paymentPeriodicity} renewal of subscription ${subscription.memberPlan.name}`
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
  public async markInvoiceAsPaid(
    invoice: Invoice & {
      subscription: Subscription | null
    }
  ) {
    const newPaidUntil = add(invoice.subscription!.paidUntil || invoice.subscription!.createdAt, {
      months: this.getMonthCount(invoice.subscription!.paymentPeriodicity)
    })
    await this.prismaService.$transaction([
      this.prismaService.subscription.update({
        where: {
          id: invoice.subscription!.id
        },
        data: {
          paidUntil: newPaidUntil
        }
      }),
      this.prismaService.invoice.update({
        where: {
          id: invoice.id
        },
        data: {
          paidAt: new Date()
        }
      })
    ])
  }
  public async deactivateSubscription(invoice: Invoice) {
    await this.prismaService.$transaction([
      this.prismaService.subscriptionDeactivation.create({
        data: {
          subscriptionID: invoice.subscriptionID!,
          date: new Date(),
          reason: SubscriptionDeactivationReason.invoiceNotPaid
        }
      }),
      this.prismaService.invoice.update({
        where: {
          id: invoice.id
        },
        data: {
          canceledAt: new Date()
        }
      })
    ])
  }

  public async chargeInvoice(
    invoice: Invoice & {
      subscription:
        | (Subscription & {
            paymentMethod: PaymentMethod
            memberPlan: MemberPlan
            user: (User & {paymentProviderCustomers: PaymentProviderCustomer[]}) | null
          })
        | null
      items: InvoiceItem[]
      subscriptionPeriods: SubscriptionPeriod[]
    },
    mailActions: Action[]
  ) {
    const paymentProvider = this.oldContextService.context.paymentProviders.find(
      pp => pp.id === invoice.subscription?.paymentMethod.paymentProviderID
    )
    if (!paymentProvider) {
      throw new Error(
        `Payment Provider ${invoice.subscription?.paymentMethod.paymentProviderID} not found!`
      )
    }
    if (paymentProvider.offSessionPayments) {
      return await this.offSessionPayment(invoice, paymentProvider, mailActions)
    }
    return {
      action: undefined,
      errorCode: ''
    }
  }

  private async offSessionPayment(
    invoice: Invoice & {
      subscription:
        | (Subscription & {
            paymentMethod: PaymentMethod
            memberPlan: MemberPlan
            user: (User & {paymentProviderCustomers: PaymentProviderCustomer[]}) | null
          })
        | null
      items: InvoiceItem[]
      subscriptionPeriods: SubscriptionPeriod[]
    },
    paymentProvider: PaymentProvider,
    mailActions: Action[]
  ) {
    if (invoice.canceledAt || invoice.paidAt) {
      throw new Error(
        `Tried to renew paid ${invoice.paidAt} or canceled invoice ${invoice.canceledAt} for subscription ${invoice.subscription?.id}`
      )
    }
    if (!invoice.subscription || !invoice.subscription.user) {
      throw new Error('Subscription or user not found!')
    }

    const customer = invoice.subscription.user.paymentProviderCustomers.find(
      ppc => ppc.paymentProviderID === invoice.subscription?.paymentMethod.paymentProviderID
    )
    const renewalFailedAction = mailActions.find(ma => ma.type === SubscriptionEvent.RENEWAL_FAILED)

    if (!customer) {
      return {
        action: renewalFailedAction,
        errorCode: 'customer-not-found'
      }
    }

    const payment = await this.prismaService.payment.create({
      data: {
        paymentMethodID: invoice.subscription.paymentMethod.id,
        invoiceID: invoice.id,
        state: PaymentState.created
      }
    })

    const intent = await paymentProvider.createIntent({
      paymentID: payment.id,
      invoice,
      saveCustomer: false,
      customerID: customer.customerID
    })

    await this.prismaService.payment.update({
      where: {id: payment.id},
      data: {
        state: intent.state,
        intentID: intent.intentID,
        intentData: intent.intentData,
        intentSecret: intent.intentSecret,
        paymentData: intent.paymentData,
        paymentMethodID: payment.paymentMethodID,
        invoiceID: payment.invoiceID
      }
    })

    if (intent.state === PaymentState.paid) {
      const renewalSuccessAction = mailActions.find(
        ma => ma.type === SubscriptionEvent.RENEWAL_SUCCESS
      )
      await this.markInvoiceAsPaid(invoice)
      return {
        action: renewalSuccessAction,
        errorCode: ''
      }
    } else {
      return {
        action: renewalFailedAction,
        errorCode: 'user-action-required'
      }
    }
  }
}
