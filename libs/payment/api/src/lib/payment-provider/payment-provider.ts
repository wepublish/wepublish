import {
  Currency,
  Invoice,
  InvoiceItem,
  PaymentProviderType,
  MetadataProperty,
  Payment,
  PaymentState,
  PrismaClient,
  SettingPaymentProvider,
  Subscription,
} from '@prisma/client';
import bodyParser from 'body-parser';
import { NextHandleFunction } from 'connect';
import express from 'express';
import DataLoader from 'dataloader';
import { timingSafeEqual } from 'crypto';
import { KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';

export type InvoiceWithItems = Invoice & {
  items: InvoiceItem[];
};

export type InvoicesByID = DataLoader<string, InvoiceWithItems | null>;
export type PaymentsByID = DataLoader<string, Payment | null>;

export interface WebhookForPaymentIntentProps {
  req: express.Request;
}

export interface IntentState {
  paymentID: string;
  state: PaymentState;
  paidAt?: Date;
  paymentData?: string;
  customerID?: string;
}

export interface CreatePaymentIntentProps {
  paymentID: string;
  invoice: InvoiceWithItems;
  currency: Currency;
  saveCustomer: boolean;
  customerID?: string;
  successURL?: string;
  failureURL?: string;
  backgroundTask?: boolean;
}

export interface CheckIntentProps {
  intentID: string;
  paymentID: string;
}

export interface UpdateRemoteSubscriptionAmountProps {
  newAmount: number;
  subscription: Subscription & { properties: MetadataProperty[] };
}

export interface CancelRemoteSubscriptionProps {
  subscription: Subscription & { properties: MetadataProperty[] };
}

export interface CreateRemoteInvoiceProps {
  subscription: Subscription & { properties: MetadataProperty[] };
  invoice: Invoice & { items: InvoiceItem[] };
}

export interface UpdatePaymentWithIntentStateProps {
  intentState: IntentState;
}

export interface WebhookUpdatesProps {
  payment: Payment;
  body: any;
  headers: any;
}

export interface GetInvoiceIDFromWebhookProps {
  body: any;
  headers: any;
}

export interface Intent {
  intentID: string;
  intentSecret: string;
  state: PaymentState;
  paidAt?: Date;
  intentData?: string;
  paymentData?: string;
  errorCode?: string;
}

export type WebhookResponse = {
  status: number;
  message?: string;
  paymentStates?: IntentState[];
};

export interface PaymentProvider {
  id: string;
  remoteManagedSubscription: boolean;

  incomingRequestHandler: NextHandleFunction;

  webhookForPaymentIntent(
    props: WebhookForPaymentIntentProps
  ): Promise<WebhookResponse>;

  createIntent(props: CreatePaymentIntentProps): Promise<Intent>;

  checkIntentStatus(props: CheckIntentProps): Promise<IntentState>;

  updatePaymentWithIntentState(
    props: UpdatePaymentWithIntentStateProps
  ): Promise<Payment>;

  updateRemoteSubscriptionAmount(
    props: UpdateRemoteSubscriptionAmountProps
  ): Promise<void>;

  cancelRemoteSubscription(props: CancelRemoteSubscriptionProps): Promise<void>;

  createRemoteInvoice(props: CreateRemoteInvoiceProps): Promise<void>;

  getConfig(): Promise<SettingPaymentProvider | null>;

  isOffSession(): Promise<boolean>;

  getName(): Promise<string>;
}

export interface PaymentProviderProps {
  id: string;
  incomingRequestHandler?: NextHandleFunction;
  prisma: PrismaClient;
  kv: KvTtlCacheService;
}

export abstract class BasePaymentProvider implements PaymentProvider {
  readonly id: string;
  readonly prisma: PrismaClient;
  readonly kv: KvTtlCacheService;
  readonly remoteManagedSubscription: boolean = false;

  readonly incomingRequestHandler: NextHandleFunction;

  protected constructor(props: PaymentProviderProps) {
    this.id = props.id;
    this.incomingRequestHandler =
      props.incomingRequestHandler ?? bodyParser.json();
    this.prisma = props.prisma;
    this.kv = props.kv;
  }

  abstract webhookForPaymentIntent(
    props: WebhookForPaymentIntentProps
  ): Promise<WebhookResponse>;

  abstract createIntent(props: CreatePaymentIntentProps): Promise<Intent>;

  abstract checkIntentStatus(props: CheckIntentProps): Promise<IntentState>;

  async updateRemoteSubscriptionAmount(
    props: UpdateRemoteSubscriptionAmountProps
  ): Promise<void> {
    return;
  }

  async cancelRemoteSubscription(
    props: CancelRemoteSubscriptionProps
  ): Promise<void> {
    return;
  }

  async getConfig(): Promise<SettingPaymentProvider | null> {
    return await new PaymentProviderConfig(
      this.prisma,
      this.kv,
      this.id
    ).getConfig();
  }

  async isOffSession(): Promise<boolean> {
    const config = await this.getConfig();
    return config.offSessionPayments;
  }

  async getName(): Promise<string> {
    const config = await this.getConfig();
    return config.name;
  }

  public async initDatabaseConfiguration(
    type: PaymentProviderType
  ): Promise<void> {
    await this.prisma.settingPaymentProvider.upsert({
      where: {
        id: this.id,
      },
      create: {
        id: this.id,
        type,
      },
      update: {},
    });
    return;
  }

  async createRemoteInvoice(props: CreateRemoteInvoiceProps): Promise<void> {
    return;
  }

  async updatePaymentWithIntentState({
    intentState,
  }: UpdatePaymentWithIntentStateProps): Promise<Payment> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: intentState.paymentID },
    });
    // TODO: should we overwrite already paid/canceled payments
    if (!payment)
      throw new Error(`Payment with ID ${intentState.paymentID} not found`);

    const updatedPayment = await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        state: intentState.state,
        paymentData: intentState.paymentData,
        intentData: payment.intentData,
        intentSecret: payment.intentSecret,
        intentID: payment.intentID,
        invoiceID: payment.invoiceID,
        paymentMethodID: payment.paymentMethodID,
      },
    });

    if (!updatedPayment) {
      throw new Error('Error while updating Payment');
    }

    // get invoice and subscription joins out of the payment
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: payment.invoiceID },
    });

    if (!invoice || !invoice.subscriptionID) {
      throw new Error(`Invoice with ID ${payment.invoiceID} does not exist`);
    }

    const subscription = await this.prisma.subscription.findUnique({
      where: {
        id: invoice.subscriptionID,
      },
      include: {
        periods: true,
      },
    });

    if (!subscription) {
      throw new Error(
        `Subscription with ID ${invoice.subscriptionID} does not exist`
      );
    }

    const invoicePeriod = subscription.periods.find(
      period => period.invoiceID === invoice.id
    );

    if (!invoicePeriod) {
      throw new Error(`Invoice with ID ${invoice.id} has no period!`);
    }

    // Mark invoice as paid
    if (intentState.state === PaymentState.paid) {
      await this.prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          paidAt: new Date(),
        },
      });

      await this.prisma.subscription.update({
        where: { id: invoice.subscriptionID },
        data: {
          paidUntil: invoicePeriod.endsAt,
        },
      });
    }

    // update payment provider
    if (intentState.customerID && payment.invoiceID) {
      await this.updatePaymentProvider(subscription, intentState.customerID);
    }

    return updatedPayment;
  }

  /**
   * adding or updating paymentProvider customer ID for user
   *
   * @param subscription
   * @param customerID
   * @private
   */
  private async updatePaymentProvider(
    subscription: Subscription,
    customerID: string
  ) {
    if (!subscription) {
      throw new Error(
        'Empty subscription within updatePaymentProvider method.'
      );
    }

    const user = await this.prisma.user.findUnique({
      where: {
        id: subscription.userID,
      },
      include: {
        paymentProviderCustomers: true,
      },
    });

    if (!user)
      throw new Error(`User with ID ${subscription.userID} does not exist`);

    await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        paymentProviderCustomers: {
          deleteMany: {
            paymentProviderID: this.id,
          },
          create: {
            paymentProviderID: this.id,
            customerID,
          },
        },
      },
    });
  }

  protected timeConstantCompare(a: string, b: string): boolean {
    try {
      return timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'));
    } catch {
      return false;
    }
  }
}

class PaymentProviderConfig {
  private readonly ttl = 60;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly kv: KvTtlCacheService,
    private readonly id: string
  ) {}

  private async load(): Promise<SettingPaymentProvider | null> {
    return this.prisma.settingPaymentProvider.findUnique({
      where: {
        id: this.id,
      },
    });
  }

  async getFromCache(): Promise<SettingPaymentProvider | null> {
    return this.kv.getOrLoad<SettingPaymentProvider | null>(
      `paymentprovider:settings:${this.id}`,
      () => this.load(),
      this.ttl
    );
  }

  async getConfig(): Promise<SettingPaymentProvider | null> {
    return await this.getFromCache();
  }
}
