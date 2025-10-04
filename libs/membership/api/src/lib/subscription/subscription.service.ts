import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Invoice,
  InvoiceItem,
  MemberPlan,
  PaymentMethod,
  PaymentPeriodicity,
  PaymentProviderCustomer,
  PaymentState,
  PrismaClient,
  Subscription,
  SubscriptionDeactivation,
  SubscriptionDeactivationReason,
  SubscriptionEvent,
  SubscriptionPeriod,
  User,
} from '@prisma/client';
import { PaymentProvider, PaymentsService } from '@wepublish/payment/api';
import { add, endOfDay, startOfDay } from 'date-fns';
import { Action } from '../subscription-event-dictionary/subscription-event-dictionary.type';
import { logger, mapPaymentPeriodToMonths } from '@wepublish/utils/api';

export type SubscriptionControllerConfig = {
  subscription: Subscription;
};

interface ChargeStatus {
  action: Action | undefined;
  errorCode: string;
}

interface PeriodBounds {
  startsAt: Date;
  endsAt: Date;
}

@Injectable()
export class SubscriptionService {
  constructor(
    private prismaService: PrismaClient,
    private payments: PaymentsService
  ) {}

  public async getActiveSubscriptionsWithoutInvoice(
    runDate: Date,
    closestRenewalDate: Date
  ): Promise<
    (Subscription & {
      periods: SubscriptionPeriod[];
      deactivation: SubscriptionDeactivation | null;
      user: User;
      paymentMethod: PaymentMethod;
      memberPlan: MemberPlan;
    })[]
  > {
    return this.prismaService.subscription.findMany({
      where: {
        paidUntil: {
          lte: endOfDay(closestRenewalDate),
        },
        deactivation: {
          is: null,
        },
        periods: {
          none: {
            startsAt: {
              gt: startOfDay(runDate),
            },
          },
        },
        autoRenew: true,
        invoices: {
          none: {
            paidAt: null,
            canceledAt: null,
          },
        },
      },
      include: {
        periods: true,
        deactivation: true,
        user: true,
        paymentMethod: true,
        memberPlan: true,
        invoices: true,
      },
    });
  }

  /**
   * Get all invoices that are open
   * @returns All invoices that are due.
   */
  public async findAllOpenInvoices() {
    return this.prismaService.invoice.findMany({
      where: {
        canceledAt: null,
        paidAt: null,
        // skip invoices where the subscription has been deleted
        subscriptionID: {
          not: null,
        },
        subscription: {
          confirmed: true,
        },
      },
      include: {
        subscription: {
          include: {
            paymentMethod: true,
            memberPlan: true,
            user: {
              include: {
                paymentProviderCustomers: true,
              },
            },
          },
        },
        subscriptionPeriods: true,
        items: true,
      },
    });
  }

  /**
   * Get all invoices that are due at the current date or earlier.
   * @param runDate The current date.
   * @returns All invoices that are due.
   */
  public async findUnpaidDueInvoices(runDate: Date) {
    return this.prismaService.invoice.findMany({
      where: {
        dueAt: {
          lte: endOfDay(runDate),
        },
        canceledAt: null,
        paidAt: null,
        // skip invoices where the subscription has been deleted
        subscriptionID: {
          not: null,
        },
        subscription: {
          confirmed: true,
        },
      },
      include: {
        subscription: {
          include: {
            paymentMethod: true,
            memberPlan: true,
            user: {
              include: {
                paymentProviderCustomers: true,
              },
            },
          },
        },
        subscriptionPeriods: true,
        items: true,
      },
    });
  }

  /**
   * Find all invoices that should be deactivated at the given date and are unpaid.
   * @param runDate the date to check for.
   * @returns a list of invoices.
   */
  public async findUnpaidScheduledForDeactivationInvoices(runDate: Date) {
    return this.prismaService.invoice.findMany({
      where: {
        scheduledDeactivationAt: {
          lte: startOfDay(runDate),
        },
        canceledAt: null,
        paidAt: null,
        // skip invoices where the subscription has been deleted
        subscriptionID: {
          not: null,
        },
      },
      include: {
        subscription: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  /**
   * Find all subscriptions that have autorenew false and have a missing deactivation object
   * @param runDate the date to check for
   * @returns a list of subscriptions.
   */

  public async findActiveExpiredNotAutoRenewSubscriptions(runDate: Date) {
    return this.prismaService.subscription.findMany({
      where: {
        paidUntil: {
          lte: endOfDay(runDate),
        },
        autoRenew: false,
        deactivation: {
          is: null,
        },
      },
      include: {
        deactivation: true,
      },
    });
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
        startsAt: add(new Date(), { days: 1 }),
        endsAt: add(new Date(), {
          months: mapPaymentPeriodToMonths(periodicity),
        }),
      };
    }
    const latestPeriod = periods.reduce(function (prev, current) {
      return prev.endsAt > current.endsAt ? prev : current;
    });
    return {
      startsAt: add(latestPeriod.endsAt, { days: 1 }),
      endsAt: add(latestPeriod.endsAt, {
        months: mapPaymentPeriodToMonths(periodicity),
      }),
    };
  }

  /**
   * Create an invoice for the new runtime of a subscription.
   * @param subscription The subscription to create an invoice for.
   * @param deactivationDate The object containing the deactivation date at the end of the new period.
   * @returns The invoice.
   */
  public async createInvoice(
    subscription: Subscription & {
      periods: SubscriptionPeriod[];
      user: User;
      memberPlan: MemberPlan;
    },
    deactivationDate: Date
  ) {
    const amount =
      subscription.monthlyAmount *
      mapPaymentPeriodToMonths(subscription.paymentPeriodicity);
    const description = `${subscription.paymentPeriodicity} renewal of subscription ${subscription.memberPlan.name}`;

    return this.prismaService.invoice.create({
      data: {
        currency: subscription.currency,
        mail: subscription.user.email,
        dueAt: subscription.paidUntil || new Date(),
        description,
        items: {
          create: {
            name: `${subscription.memberPlan.name}`,
            description,
            quantity: 1,
            amount,
          },
        },
        scheduledDeactivationAt: deactivationDate,
        subscriptionPeriods: {
          create: {
            paymentPeriodicity: subscription.paymentPeriodicity,
            amount,
            subscription: {
              connect: {
                id: subscription.id,
              },
            },
            ...this.getNextPeriod(
              subscription.periods,
              subscription.paymentPeriodicity
            ),
          },
        },
        subscription: {
          connect: {
            id: subscription.id,
          },
        },
      },
      include: {
        items: true,
      },
    });
  }

  /**
   * Mark a specific invoice and the corresponding subscription as paid.
   * @param invoice The invoice to mark.
   */
  public async markInvoiceAsPaid(
    invoice: Invoice & {
      subscription: Subscription | null;
    }
  ) {
    const newPaidUntil = add(
      invoice.subscription!.paidUntil || invoice.subscription!.createdAt,
      {
        months: mapPaymentPeriodToMonths(
          invoice.subscription!.paymentPeriodicity
        ),
      }
    );

    await this.prismaService.$transaction([
      this.prismaService.subscription.update({
        where: {
          id: invoice.subscription!.id,
        },
        data: {
          paidUntil: newPaidUntil,
        },
      }),
      this.prismaService.invoice.update({
        where: {
          id: invoice.id,
        },
        data: {
          paidAt: new Date(),
        },
      }),
    ]);
  }

  /**
   * Deactivates the subscription belonging to an invoice.
   * @param invoice the invoice belonging to subscription.
   */
  public async deactivateSubscription(
    invoice: Invoice & { subscription: Subscription | null }
  ) {
    if (!invoice.subscription) {
      throw new BadRequestException(
        `Invoice ${invoice.id} has no subscription assigned!`
      );
    }
    await this.prismaService.$transaction([
      this.prismaService.subscriptionDeactivation.create({
        data: {
          subscriptionID: invoice.subscription.id || invoice.subscriptionID!,
          date: invoice.subscription.paidUntil ?? invoice.subscription.startsAt,
          reason: SubscriptionDeactivationReason.invoiceNotPaid,
        },
      }),
      this.prismaService.invoice.update({
        where: {
          id: invoice.id,
        },
        data: {
          canceledAt: new Date(),
        },
      }),
    ]);
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
            paymentMethod: PaymentMethod;
            memberPlan: MemberPlan;
            user:
              | (User & { paymentProviderCustomers: PaymentProviderCustomer[] })
              | null;
          })
        | null;
      items: InvoiceItem[];
      subscriptionPeriods: SubscriptionPeriod[];
    },
    mailActions: Action[]
  ): Promise<ChargeStatus> {
    const paymentProvider = this.payments.findById(
      invoice.subscription!.paymentMethod.paymentProviderID
    );

    if (!paymentProvider) {
      throw new NotFoundException(
        `Payment Provider ${invoice.subscription?.paymentMethod.paymentProviderID} not found!`
      );
    }

    if (paymentProvider.offSessionPayments) {
      return await this.offSessionPayment(
        invoice,
        paymentProvider,
        mailActions
      );
    }

    return {
      action: undefined,
      errorCode: '',
    };
  }

  /**
   * Check state of remote invoice via payment provider
   * @param invoice The invoice to charge.
   * @returns The transaction status.
   */
  public async checkInvoiceState(
    invoice: Invoice & {
      subscription:
        | (Subscription & {
            paymentMethod: PaymentMethod;
            memberPlan: MemberPlan;
            user:
              | (User & { paymentProviderCustomers: PaymentProviderCustomer[] })
              | null;
          })
        | null;
      items: InvoiceItem[];
      subscriptionPeriods: SubscriptionPeriod[];
    }
  ): Promise<undefined> {
    const paymentProvider = this.payments.findById(
      invoice.subscription!.paymentMethod.paymentProviderID
    );

    if (!paymentProvider) {
      throw new NotFoundException(
        `Payment Provider ${invoice.subscription?.paymentMethod.paymentProviderID} not found!`
      );
    }
    const payments = await this.payments.findByInvoiceId(invoice.id);
    for (const payment of payments) {
      if (!payment || !payment.intentID) continue;
      try {
        const intentState = await paymentProvider.checkIntentStatus({
          intentID: payment.intentID,
          paymentID: payment.id,
        });
        await paymentProvider.updatePaymentWithIntentState({
          intentState,
        });
      } catch (e) {
        logger('checkInvoiceState').error(
          'Checking payment <%s> with intent %s on payment provider %s soft failed with error: %s',
          payment.id,
          payment.intentID,
          paymentProvider.name,
          e
        );
      }
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
            paymentMethod: PaymentMethod;
            memberPlan: MemberPlan;
            user:
              | (User & { paymentProviderCustomers: PaymentProviderCustomer[] })
              | null;
          })
        | null;
      items: InvoiceItem[];
      subscriptionPeriods: SubscriptionPeriod[];
    },
    paymentProvider: PaymentProvider,
    mailActions: Action[]
  ): Promise<ChargeStatus> {
    if (invoice.paidAt) {
      throw new BadRequestException(
        `Can not renew paid invoice for subscription ${invoice.subscription?.id}`
      );
    }

    if (invoice.canceledAt) {
      throw new BadRequestException(
        `Can not renew canceled invoice for subscription ${invoice.subscription?.id}`
      );
    }

    if (!invoice.subscription) {
      throw new NotFoundException('Subscription not found!');
    }

    if (!invoice.subscription.memberPlan) {
      throw new NotFoundException('Memberplan not found!');
    }

    if (!invoice.subscription.user) {
      throw new NotFoundException('User not found!');
    }

    const customer = invoice.subscription.user.paymentProviderCustomers.find(
      ppc =>
        ppc.paymentProviderID ===
        invoice.subscription?.paymentMethod.paymentProviderID
    );
    const renewalFailedAction = mailActions.find(
      ma => ma.type === SubscriptionEvent.RENEWAL_FAILED
    );

    if (!customer) {
      return {
        action: renewalFailedAction,
        errorCode: 'customer-not-found',
      };
    }

    const payment = await this.prismaService.payment.create({
      data: {
        paymentMethodID: invoice.subscription.paymentMethod.id,
        invoiceID: invoice.id,
        state: PaymentState.created,
      },
    });

    try {
      const intent = await paymentProvider.createIntent({
        paymentID: payment.id,
        invoice,
        currency: invoice.currency,
        saveCustomer: false,
        customerID: customer.customerID,
        backgroundTask: true,
      });

      await this.prismaService.payment.update({
        where: { id: payment.id },
        data: {
          state: intent.state,
          intentID: intent.intentID,
          intentData: intent.intentData,
          intentSecret: intent.intentSecret,
          paymentData: intent.paymentData,
          paymentMethodID: payment.paymentMethodID,
          invoiceID: payment.invoiceID,
        },
      });

      if (intent.state === PaymentState.paid) {
        const renewalSuccessAction = mailActions.find(
          ma => ma.type === SubscriptionEvent.RENEWAL_SUCCESS
        );
        await this.markInvoiceAsPaid(invoice);
        return {
          action: renewalSuccessAction,
          errorCode: '',
        };
      }

      return {
        action: renewalFailedAction,
        errorCode: 'user-action-required',
      };
    } catch (e) {
      await this.prismaService.payment.update({
        where: { id: payment.id },
        data: {
          state: PaymentState.requiresUserAction,
          paymentData: JSON.stringify(e),
          paymentMethodID: payment.paymentMethodID,
          invoiceID: payment.invoiceID,
        },
      });

      return {
        action: renewalFailedAction,
        errorCode: JSON.stringify(e),
      };
    }
  }
}
