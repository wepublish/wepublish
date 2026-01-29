import {
  InvoiceWithItems,
  PaymentProvider,
} from './payment-provider/payment-provider';
import { Payment, PaymentState, PrismaClient } from '@prisma/client';
import { sub } from 'date-fns';
import { GraphQLError } from 'graphql/index';
import {
  PaymentFromInvoiceInput,
  PaymentFromSubscriptionArgs,
} from './payment.model';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  PAYMENT_METHOD_CONFIG,
  PaymentMethodConfig,
} from './payment-method/payment-method.config';

interface CreatePaymentWithProvider {
  paymentMethodID: string;
  invoice: InvoiceWithItems;
  saveCustomer: boolean;
  successURL?: string;
  failureURL?: string;
  userId?: string;
  migrateToTargetPaymentMethodID?: string;
}

@Injectable()
export class PaymentsService {
  private readonly paymentProviders = this.config.paymentProviders;

  constructor(
    private prisma: PrismaClient,
    @Inject(PAYMENT_METHOD_CONFIG)
    private config: PaymentMethodConfig
  ) {}

  getProviders() {
    return this.paymentProviders;
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
        properties: true,
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
      throw new BadRequestException(blockingPayment.id);
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
    await this.prisma.subscription.update({
      data: {
        confirmed: true,
      },
      where: {
        id: invoice.subscriptionID || undefined,
      },
    });

    const payment = await this.prisma.payment.create({
      data: {
        paymentMethodID,
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
      successURL,
      failureURL,
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

      if (paymentProvider) {
        await paymentProvider.updatePaymentWithIntentState({
          intentState,
        });
      }
    }

    if (intent.errorCode) {
      throw new GraphQLError(intent.errorCode || 'Unknown error');
    }

    return updatedPayment as Payment;
  }
}
