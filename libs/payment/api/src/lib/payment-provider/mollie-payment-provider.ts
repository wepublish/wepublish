import {
  BasePaymentProvider,
  CheckIntentProps,
  CreatePaymentIntentProps,
  Intent,
  IntentState,
  PaymentProviderProps,
  WebhookForPaymentIntentProps,
  WebhookResponse,
} from './payment-provider';
import { logger } from '@wepublish/utils/api';
import { PaymentState } from '@prisma/client';
import createMollieClient, { SequenceType, Payment } from '@mollie/api-client';
import { mapMolliePaymentMethods } from '../payment.methode.mapper';

const erroredPaymentIntent = {
  intentID: 'error',
  intentSecret: '',
  intentData: 'error',
  state: PaymentState.requiresUserAction,
  errorCode: 'error',
};

type MolliePaymentMetadata = {
  paymentID?: string;
  mail?: string;
};

export function mapMollieEventToPaymentStatus(event: string): PaymentState {
  switch (event) {
    case 'failed':
    case 'expired':
      return PaymentState.requiresUserAction;
    case 'open':
    case 'authorized':
    case 'pending':
      return PaymentState.processing;
    case 'paid':
      return PaymentState.paid;
    case 'canceled':
      return PaymentState.canceled;
    default:
      throw new Error(`Unhandled ${event} state received from mollie`);
  }
}

export function calculateAndFormatAmount(invoice: {
  items: { amount: number; quantity: number }[];
}) {
  return (
    invoice.items.reduce(
      (prevItem, currentItem) =>
        prevItem + currentItem.amount * currentItem.quantity,
      0
    ) / 100
  ).toFixed(2);
}

export class MolliePaymentProvider extends BasePaymentProvider {
  constructor(props: PaymentProviderProps) {
    super(props);
  }

  async getMollieGateway() {
    const config = await this.getConfig();
    if (!config.apiKey) {
      throw new Error('Mollie missing api key');
    }
    return createMollieClient({ apiKey: config.apiKey });
  }

  async generateWebhookUrl(): Promise<string> {
    const config = await this.getConfig();
    return `${config.mollie_apiBaseUrl}/payment-webhooks/${this.id}?key=${config.webhookEndpointSecret}`;
  }

  async webhookForPaymentIntent(
    props: WebhookForPaymentIntentProps
  ): Promise<WebhookResponse> {
    const intentStates: IntentState[] = [];
    const key = props.req.query?.['key'] as string;

    const config = await this.getConfig();
    if (
      !this.timeConstantCompare(
        key,
        this.assertProperty(
          'webhookEndpointSecret',
          config.webhookEndpointSecret
        )
      )
    ) {
      return {
        status: 403,
        message: 'Invalid Api Key',
      };
    }

    const molliePaymentId: string | undefined = props.req.body.id;

    if (!molliePaymentId) {
      return {
        status: 200,
        paymentStates: intentStates,
      };
    }
    const mollieClient = await this.getMollieGateway();
    const payment = await mollieClient.payments.get(molliePaymentId);
    const state = mapMollieEventToPaymentStatus(payment.status);
    const metadata = payment.metadata as MolliePaymentMetadata;
    if (state && metadata.paymentID) {
      let customerID: undefined | string;

      if ((await this.isOffSession()) && payment.customerId) {
        customerID = payment.customerId;
      }

      intentStates.push({
        paymentID: metadata.paymentID,
        paymentData: JSON.stringify(payment),
        state,
        customerID,
      });
    }
    return {
      status: 200,
      paymentStates: intentStates,
    };
  }

  async createIntent(
    createPaymentIntentProps: CreatePaymentIntentProps
  ): Promise<Intent> {
    if ((await this.isOffSession()) && createPaymentIntentProps.customerID) {
      const offsiteTransactionIntent =
        await this.createOffsiteTransactionIntent(createPaymentIntentProps);

      if (offsiteTransactionIntent.state === PaymentState.paid) {
        return offsiteTransactionIntent;
      }
    }

    return this.createGatewayIntent(createPaymentIntentProps);
  }

  async createGatewayIntent({
    invoice,
    paymentID,
    currency,
    successURL,
  }: CreatePaymentIntentProps): Promise<Intent> {
    let payment: Payment;
    try {
      let customerId: undefined | string;
      if (await this.isOffSession()) {
        const mollieClient = await this.getMollieGateway();
        const customer = await mollieClient.customers.create({
          email: invoice.mail,
          name: invoice.mail,
        });
        customerId = customer.id;
      }

      const mollieClient = await this.getMollieGateway();
      const config = await this.getConfig();
      payment = await mollieClient.payments.create({
        customerId,
        amount: {
          currency,
          value: calculateAndFormatAmount(invoice),
        },
        description: invoice.description || 'Subscription',
        redirectUrl: successURL,
        webhookUrl: await this.generateWebhookUrl(),
        sequenceType:
          (await this.isOffSession()) ?
            SequenceType.first
          : SequenceType.oneoff,
        method: mapMolliePaymentMethods(config.mollie_methods),
        metadata: {
          paymentID,
          mail: invoice.mail,
        },
      });
    } catch (err) {
      const error: any = err;

      logger('molliePaymentProvider').error(
        error,
        'Error while creating Mollie Intent for paymentProvider %s',
        this.id
      );
      return erroredPaymentIntent;
    }
    return {
      intentID: payment.id,
      intentSecret: payment.getCheckoutUrl() ?? '',
      intentData: JSON.stringify(payment),
      state: mapMollieEventToPaymentStatus(payment.status),
    };
  }

  async createOffsiteTransactionIntent({
    customerID,
    invoice,
    paymentID,
    currency,
    successURL,
  }: CreatePaymentIntentProps): Promise<Intent> {
    let payment: Payment;

    if (!customerID) {
      return erroredPaymentIntent;
    }

    try {
      const mollieClient = await this.getMollieGateway();
      payment = await mollieClient.customerPayments.create({
        customerId: customerID,
        amount: {
          currency,
          value: calculateAndFormatAmount(invoice),
        },
        description: invoice.description || 'Subscription',
        redirectUrl: successURL,
        webhookUrl: await this.generateWebhookUrl(),
        sequenceType: SequenceType.recurring,
        metadata: {
          paymentID,
          mail: invoice.mail,
        },
      });
    } catch (err) {
      return erroredPaymentIntent;
    }

    return {
      intentID: payment.id,
      intentSecret: payment.getCheckoutUrl() ?? '',
      intentData: JSON.stringify(payment),
      state: mapMollieEventToPaymentStatus(payment.status),
    };
  }

  async checkIntentStatus({
    intentID,
  }: CheckIntentProps): Promise<IntentState> {
    const mollieClient = await this.getMollieGateway();
    const payment = await mollieClient.payments.get(intentID);
    const state = mapMollieEventToPaymentStatus(payment.status);

    const metadata = payment.metadata as MolliePaymentMetadata;

    if (!metadata.paymentID) {
      logger('molliePaymentProvider').error(
        'Mollie payment with ID: %s for paymentProvider %s returned with empty paymentID',
        payment.id,
        this.id
      );
      throw new Error('empty paymentID');
    }

    return {
      state,
      paymentID: metadata.paymentID,
      paymentData: JSON.stringify(payment),
      customerID: payment.customerId ?? undefined,
    };
  }
}
