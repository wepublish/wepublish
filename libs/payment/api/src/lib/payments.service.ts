import {
  InvoiceWithItems,
  PaymentProvider,
} from './payment-provider/payment-provider';
import {
  MemberPlan,
  Payment,
  PaymentState,
  PrismaClient,
  Subscription,
} from '@prisma/client';
import { sub } from 'date-fns';
import { GraphQLError } from 'graphql/index';
import {
  PaymentFromInvoiceInput,
  PaymentFromSubscriptionArgs,
  SetPaymentProviderCustomersArgs,
} from './payment.model';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SESSION_CACHE_NAMESPACE } from '@wepublish/authentication/api';
import { NamespaceResets } from '@wepublish/kv-ttl-cache/api';
import {
  PAYMENT_METHOD_CONFIG,
  PaymentMethodConfig,
} from './payment-method/payment-method.config';
import { InvoicePaidNotifier } from './invoice-paid.listener';
import { ErrorCode } from '@wepublish/errors';
import { logger } from '@wepublish/utils/api';

interface CreatePaymentWithProvider {
  paymentMethodID: string;
  invoice: InvoiceWithItems;
  saveCustomer: boolean;
  successURL?: string;
  failureURL?: string;
  userId?: string;
  migrateToTargetPaymentMethodID?: string;
}

/** Customers setPaymentProviderCustomers stores per call. */
export const MAX_CUSTOMERS_PER_CALL = 500;

@Injectable()
export class PaymentsService {
  private readonly paymentProviders = this.config.paymentProviders;

  constructor(
    private prisma: PrismaClient,
    @Inject(PAYMENT_METHOD_CONFIG)
    private config: PaymentMethodConfig,
    private invoicePaidNotifier: InvoicePaidNotifier,
    private resets: NamespaceResets
  ) {}

  getProviders() {
    return this.paymentProviders;
  }

  /**
   * Stores which customer of `paymentProviderId` each user is — the token or
   * contact renewals are charged or invoiced with (for bexio the contact id) —
   * replacing the user's previous one of that provider. For data corrections,
   * e.g. linking imported readers to their bexio contacts; users that do not
   * exist are skipped. Returns how many users were updated.
   */
  async setPaymentProviderCustomers({
    paymentProviderId,
    customers,
  }: SetPaymentProviderCustomersArgs) {
    if (!this.findById(paymentProviderId)) {
      throw new NotFoundException('PaymentProvider', paymentProviderId);
    }

    if (!customers.length || customers.length > MAX_CUSTOMERS_PER_CALL) {
      throw new BadRequestException(
        `Pass between 1 and ${MAX_CUSTOMERS_PER_CALL} customers`
      );
    }

    if (new Set(customers.map(c => c.userId)).size !== customers.length) {
      throw new BadRequestException('Each user can only be passed once');
    }

    if (customers.some(c => !c.customerId.trim())) {
      throw new BadRequestException('Every customer needs an id');
    }

    const existing = new Set(
      (
        await this.prisma.user.findMany({
          where: { id: { in: customers.map(c => c.userId) } },
          select: { id: true },
        })
      ).map(user => user.id)
    );
    const updates = customers
      .filter(c => existing.has(c.userId))
      .map(({ userId, customerId }) =>
        this.prisma.user.update({
          where: { id: userId },
          data: {
            paymentProviderCustomers: {
              deleteMany: { paymentProviderID: paymentProviderId },
              create: {
                paymentProviderID: paymentProviderId,
                customerID: customerId.trim(),
              },
            },
          },
        })
      );

    await this.prisma.$transaction(updates);
    // sessions carry the customers
    await this.resets.reset(SESSION_CACHE_NAMESPACE);

    return updates.length;
  }

  findById(id: string) {
    return this.paymentProviders.find(p => p.id === id);
  }

  findByInvoiceId(invoiceID: string) {
    return this.prisma.payment.findMany({
      where: {
        invoiceID,
      },
    });
  }

  async findPaymentProviderByPaymentMethodeId(
    id: string
  ): Promise<PaymentProvider | undefined> {
    const paymentMethode = await this.prisma.paymentMethod.findUnique({
      where: {
        id,
      },
    });

    if (!paymentMethode) {
      return undefined;
    }

    return this.paymentProviders.find(
      p => p.id === paymentMethode.paymentProviderID
    );
  }

  async createPaymentFromInvoice(
    userId: string,
    input: PaymentFromInvoiceInput
  ) {
    const {
      invoiceID,
      paymentMethodID,
      paymentMethodSlug,
      successURL,
      failureURL,
    } = input;

    if (
      (paymentMethodID == null && paymentMethodSlug == null) ||
      (paymentMethodID != null && paymentMethodSlug != null)
    ) {
      throw new BadRequestException(
        'You must provide either `paymentMethodID` or `paymentMethodSlug`.'
      );
    }

    const paymentMethod = await this.prisma.paymentMethod.findFirst({
      where: {
        id: paymentMethodID ? paymentMethodID : undefined,
        slug: paymentMethodID ? undefined : paymentMethodSlug,
        active: true,
      },
    });

    if (!paymentMethod) {
      throw new BadRequestException(
        `PaymentMethod not found ${paymentMethodID || paymentMethodSlug}`
      );
    }

    const invoice = await this.prisma.invoice.findUnique({
      where: {
        id: invoiceID,
      },
      include: {
        items: true,
      },
    });

    if (!invoice || !invoice.subscriptionID) {
      throw new BadRequestException(`Invoice not found ${invoiceID}`);
    }

    if (invoice.paidAt || invoice.canceledAt) {
      throw new BadRequestException(
        `Invoice with id ${invoiceID} is already paid or canceled!`
      );
    }

    const subscription = await this.prisma.subscription.findUnique({
      where: {
        id: invoice.subscriptionID || undefined,
      },
      include: {
        deactivation: true,
        periods: true,
        memberPlan: true,
      },
    });

    if (!subscription || subscription.userID !== userId) {
      throw new BadRequestException(`Invoice not found ${invoiceID}`);
    }

    // Prevent multiple payment of same invoice!
    const blockingPayment = await this.prisma.payment.findFirst({
      where: {
        invoiceID,
        state: {
          in: [
            PaymentState.created,
            PaymentState.submitted,
            PaymentState.processing,
          ],
        },
        createdAt: {
          gte: sub(new Date(), { minutes: 1 }),
        },
      },
    });
    if (blockingPayment) {
      logger('paymentsService').warn(
        `Blocked duplicate payment attempt for invoice ${invoiceID}: payment ${blockingPayment.id} is still pending`
      );
      throw new BadRequestException(ErrorCode.PaymentAlreadyRunning);
    }

    return await this.createPaymentWithProvider({
      paymentMethodID: paymentMethod.id,
      invoice,
      saveCustomer: true,
      successURL,
      failureURL,
      userId,
      migrateToTargetPaymentMethodID:
        subscription.memberPlan.migrateToTargetPaymentMethodID ?? undefined,
    });
  }

  async createPaymentFromSubscription(
    userId: string,
    { subscriptionId, successURL, failureURL }: PaymentFromSubscriptionArgs
  ) {
    const invoice = await this.prisma.invoice.findFirst({
      where: {
        subscriptionID: subscriptionId,
        paidAt: null,
        canceledAt: null,
      },
      include: {
        items: true,
        subscription: {
          include: {
            memberPlan: true,
          },
        },
      },
    });

    if (!invoice) {
      throw new BadRequestException(
        `Unpaid Invoice not found ${subscriptionId}`
      );
    }

    if (invoice.subscription?.userID !== userId) {
      throw new BadRequestException(`Subscription not found ${subscriptionId}`);
    }

    return await this.createPaymentWithProvider({
      paymentMethodID: invoice.subscription?.paymentMethodID,
      invoice,
      saveCustomer: true,
      successURL,
      failureURL,
      migrateToTargetPaymentMethodID:
        invoice.subscription?.memberPlan.migrateToTargetPaymentMethodID ??
        undefined,
    });
  }

  private decorateUrlWithSubscriptionInformation(
    url: string | undefined,
    subscription: Subscription & { memberPlan: MemberPlan },
    invoice: InvoiceWithItems
  ) {
    let parsedUrl: URL;

    try {
      parsedUrl = new URL(url ?? '');
    } catch {
      return url;
    }

    parsedUrl.searchParams.set('memberPlan', subscription.memberPlan.slug);
    parsedUrl.searchParams.set(
      'productType',
      subscription.memberPlan.productType
    );
    parsedUrl.searchParams.set(
      'monthlyAmount',
      (subscription.monthlyAmount / 100).toString()
    );
    parsedUrl.searchParams.set('currency', subscription.currency);
    parsedUrl.searchParams.set(
      'amount',
      (
        invoice.items.reduce((acc, current) => acc + current.amount, 0) / 100
      ).toString()
    );
    parsedUrl.searchParams.set('periodicity', subscription.paymentPeriodicity);
    parsedUrl.searchParams.set('subscriptionId', subscription.id);

    return parsedUrl.toString();
  }

  async createPaymentWithProvider({
    paymentMethodID,
    invoice,
    saveCustomer,
    failureURL,
    successURL,
    userId,
    migrateToTargetPaymentMethodID,
  }: CreatePaymentWithProvider): Promise<Payment> {
    const paymentMethod = await this.prisma.paymentMethod.findUnique({
      where: {
        id: migrateToTargetPaymentMethodID || paymentMethodID,
        active: true,
      },
    });

    if (!paymentMethod) {
      throw new Error('Payment method not found');
    }

    const paymentProvider = this.paymentProviders.find(
      pp => pp.id === paymentMethod.paymentProviderID
    );

    if (!paymentProvider) {
      throw new Error('paymentProvider not found');
    }

    if (!invoice.subscriptionID) {
      throw new Error('Subscription not found');
    }

    /**
     * Gradually migrate subscription's payment method.
     * Mainly used in mutation.public.ts
     * Requirements written down here https://wepublish.atlassian.net/browse/TSRI-98
     */
    if (migrateToTargetPaymentMethodID) {
      await this.prisma.subscription.update({
        data: {
          paymentMethodID: migrateToTargetPaymentMethodID || '',
        },
        where: {
          id: invoice.subscriptionID || undefined,
        },
      });
    }
    const subscription = await this.prisma.subscription.update({
      data: {
        confirmed: true,
      },
      where: {
        id: invoice.subscriptionID || undefined,
      },
      include: {
        memberPlan: true,
      },
    });

    const payment = await this.prisma.payment.create({
      data: {
        paymentMethodID: paymentMethod.id,
        invoiceID: invoice.id,
        state: PaymentState.created,
      },
    });

    const customer =
      userId ?
        await this.prisma.paymentProviderCustomer.findFirst({
          where: {
            userId,
            paymentProviderID: paymentMethod.paymentProviderID,
          },
        })
      : null;

    if (!paymentProvider) {
      throw new Error('Payment provider is undefined');
    }

    const intent = await paymentProvider.createIntent({
      paymentID: payment.id,
      invoice,
      currency: invoice.currency,
      saveCustomer,
      successURL: this.decorateUrlWithSubscriptionInformation(
        successURL,
        subscription,
        invoice
      ),
      failureURL: this.decorateUrlWithSubscriptionInformation(
        failureURL,
        subscription,
        invoice
      ),
      customerID: customer?.customerID,
    });

    const updatedPayment = await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        state: intent.state,
        intentID: `${intent.intentID}`,
        intentData: intent.intentData,
        intentSecret: intent.intentSecret,
        paymentData: intent.paymentData,
        paymentMethodID: payment.paymentMethodID,
        invoiceID: payment.invoiceID,
      },
    });

    // Mark invoice as paid
    if (intent.state === PaymentState.paid && paymentProvider) {
      const intentState = await paymentProvider.checkIntentStatus({
        intentID: updatedPayment.intentID ?? '',
        paymentID: updatedPayment.id,
      });

      if (intentState) {
        await paymentProvider.updatePaymentWithIntentState({
          intentState,
        });
        await this.invoicePaidNotifier.notify(updatedPayment.invoiceID);
      }
    }

    if (intent.errorCode) {
      throw new GraphQLError(intent.errorCode || 'Unknown error');
    }

    return updatedPayment as Payment;
  }
}
