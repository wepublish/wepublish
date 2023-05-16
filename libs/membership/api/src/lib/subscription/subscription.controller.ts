import {PaymentProvider} from '@wepublish/payments'
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
import {OldContextService, PrismaService} from '@wepublish/nest-modules'

export type SubscriptionControllerConfig = {
  subscription: Subscription
}

interface ChargeStatus {
  action: Action | undefined
  errorCode: string
}

interface PeriodBounds {
  startsAt: Date
  endsAt: Date
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
            scheduledDeactivationAt: {
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

  /**
   * Get all invoices that are due at the current date or earlier.
   * @param runDate The current date.
   * @returns All invoices that are due.
   */
  public async getInvoicesToCharge(runDate: Date) {
    return this.prismaService.invoice.findMany({
      where: {
        dueAt: {
          lte: endOfDay(runDate)
        },
        canceledAt: null,
        paidAt: null,
        // skip invoices where the subscription has been deleted
        subscriptionID: {
          not: null
        }
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

  /**
   * Find all invoices that should be deactivated at the given date and are unpaid.
   * @param runDate the date to check for.
   * @returns a list of invoices.
   */
  public async getSubscriptionsToDeactivate(runDate: Date) {
    return this.prismaService.invoice.findMany({
      where: {
        scheduledDeactivationAt: {
          lte: startOfDay(runDate)
        },
        canceledAt: null,
        paidAt: null,
        // skip invoices where the subscription has been deleted
        subscriptionID: {
          not: null
        }
      },
      include: {
        subscription: {
          include: {
            user: true
          }
        }
      }
    })
  }

  /**
   * Calculate the runtime of a specific {@link PaymentPeriodicity}
   * @param periodicity The periodicity to calculate the runtime for.
   * @returns the number of months the subscription runs for.
   */
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

  /**
   * Calculates the start and end of the next subscription period. if no active
   * periods are passed, the bounds starting from now are returned.
   * @param periods The currently active periods
   * @param periodicity The duration of the next period
   * @returns Start and end date of the next period
   */
  private getNextPeriod(
    periods: SubscriptionPeriod[],
    periodicity: PaymentPeriodicity
  ): PeriodBounds {
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

  /**
   * Create an invoice for the new runtime of a subscription.
   * @param subscription The subscription to create an invoice for.
   * @param scheduledDeactivation The object containing the deactivation date at the end of the new period.
   * @returns The invoice.
   */
  public async createInvoice(
    subscription: Subscription & {
      periods: SubscriptionPeriod[]
      user: User
      memberPlan: MemberPlan
    },
    scheduledDeactivation: Action
  ) {
    if (scheduledDeactivation.type !== SubscriptionEvent.DEACTIVATION_UNPAID) {
      throw new Error(
        `Given action has not right type! ${scheduledDeactivation.type} should never happen!`
      )
    }

    const amount = subscription.monthlyAmount * this.getMonthCount(subscription.paymentPeriodicity)
    const description = `${subscription.paymentPeriodicity} renewal of subscription ${subscription.memberPlan.name}`
    const deactivationDate = add(subscription.paidUntil || new Date(), {
      days: scheduledDeactivation.daysAwayFromEnding || undefined
    })
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
        scheduledDeactivationAt: deactivationDate,
        subscriptionPeriods: {
          create: {
            paymentPeriodicity: subscription.paymentPeriodicity,
            amount,
            subscription: {
              connect: {
                id: subscription.id
              }
            },
            ...this.getNextPeriod(subscription.periods, subscription.paymentPeriodicity)
          }
        },
        subscription: {
          connect: {
            id: subscription.id
          }
        }
      }
    })
  }

  /**
   * Mark a specific invoice and the corresponding subscription as paid.
   * @param invoice The invoice to mark.
   */
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

  /**
   * Deactivates the subscription belonging to an invoice.
   * @param invoice the invoice belonging to subscription.
   */
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

  /**
   * Try to charge the payment provider for a specific invoice. If the provider
   * supports off-session payments, it is charged automatically. If it doesn't
   * support them, the method returns.
   * @param invoice The invoice to charge.
   * @param mailActions The possible mailtemplates to use in case of success/failure.
   * @returns The transaction status.
   */
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
  ): Promise<ChargeStatus> {
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

  /**
   * Try to charge an off session payment. This creates a payment record and marks the
   * invoice as paid if the charge was successful.
   * @param invoice The invoice to charge.
   * @param paymentProvider The payment provider.
   * @param mailActions The possible mails to deliver on successful or failed charge.
   * @returns The transaction status.
   */
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
  ): Promise<ChargeStatus> {
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
