import {
  AuthorizationIntent,
  AuthorizationOutcome,
  AuthorizationState,
  BasePaymentProvider,
  CheckAuthorizationProps,
  CheckIntentProps,
  CreateAuthorizationIntentProps,
  CreatePaymentIntentProps,
  Intent,
  IntentState,
  PaymentProviderProps,
  ReleaseAuthorizationProps,
  WebhookForPaymentIntentProps,
  WebhookResponse,
} from './payment-provider';
import { logger } from '@wepublish/utils/api';
import { PaymentState } from '@prisma/client';
import createMollieClient, {
  CaptureMethod,
  SequenceType,
  Payment,
} from '@mollie/api-client';
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
  /** Set instead of paymentID on the hold of a payment method change. */
  changeID?: string;
  mail?: string;
};

/** Held to authorize a payment method, in cents; released, never captured. */
const AUTHORIZATION_AMOUNT = 1;

const MOLLIE_API_URL = 'https://api.mollie.com/v2';

export function mapMollieAuthorizationStatus(
  status: string
): AuthorizationOutcome {
  switch (status) {
    case 'authorized':
    case 'paid':
      return 'authorized';
    case 'open':
    case 'pending':
      return 'processing';
    default:
      return 'failed';
  }
}

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

export function mapMolliePaymentToPaymentStatus(
  payment: Payment
): PaymentState {
  if (
    payment.amountChargedBack &&
    Number(payment.amountChargedBack.value) > 0
  ) {
    return PaymentState.chargeback;
  }
  return mapMollieEventToPaymentStatus(payment.status);
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
  override readonly supportsStandaloneInvoices = true;

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
    const metadata = payment.metadata as MolliePaymentMetadata;

    if (metadata?.changeID) {
      return {
        status: 200,
        paymentStates: intentStates,
        authorizationStates: [this.authorizationState(payment)],
      };
    }

    const state = mapMolliePaymentToPaymentStatus(payment);
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
    saveCustomer,
    customerID,
  }: CreatePaymentIntentProps): Promise<Intent> {
    let payment: Payment;
    try {
      const setUpMandate =
        (saveCustomer || !!customerID) && (await this.isOffSession());
      let customerId: undefined | string;

      if (setUpMandate) {
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
        sequenceType: setUpMandate ? SequenceType.first : SequenceType.oneoff,
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
    const state = mapMolliePaymentToPaymentStatus(payment);

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

  override supportsAuthorization(): boolean {
    return true;
  }

  /**
   * A first payment with a manual capture: the reader authorizes a 0.01 hold,
   * which creates the mandate renewals are charged with. The hold is released
   * afterwards and never captured.
   */
  override async createAuthorizationIntent({
    changeID,
    currency,
    customerID,
    email,
    successURL,
  }: CreateAuthorizationIntentProps): Promise<AuthorizationIntent> {
    const mollieClient = await this.getMollieGateway();
    const config = await this.getConfig();

    const customerId =
      customerID ??
      (
        await mollieClient.customers.create({
          email: email ?? '',
          name: email ?? '',
        })
      ).id;

    const payment = await mollieClient.payments.create({
      customerId,
      amount: {
        currency,
        value: (AUTHORIZATION_AMOUNT / 100).toFixed(2),
      },
      description: 'Payment method authorization',
      redirectUrl: successURL,
      webhookUrl: await this.generateWebhookUrl(),
      sequenceType: SequenceType.first,
      captureMode: CaptureMethod.manual,
      method: mapMolliePaymentMethods(config.mollie_methods),
      metadata: {
        changeID,
        mail: email,
      },
    });

    return {
      intentID: payment.id,
      intentSecret: payment.getCheckoutUrl() ?? '',
      intentData: JSON.stringify(payment),
      state: mapMollieAuthorizationStatus(payment.status),
      amount: AUTHORIZATION_AMOUNT,
    };
  }

  override async checkAuthorizationStatus({
    intentID,
  }: CheckAuthorizationProps): Promise<AuthorizationState | null> {
    const mollieClient = await this.getMollieGateway();
    const payment = await mollieClient.payments.get(intentID);

    if (!(payment.metadata as MolliePaymentMetadata)?.changeID) {
      return null;
    }

    return this.authorizationState(payment);
  }

  /**
   * The api client has no call for it yet:
   * https://docs.mollie.com/reference/release-authorization
   */
  override async releaseAuthorization({
    intentID,
  }: ReleaseAuthorizationProps): Promise<void> {
    const config = await this.getConfig();
    const response = await fetch(
      `${MOLLIE_API_URL}/payments/${intentID}/release-authorization`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.assertProperty('apiKey', config.apiKey)}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `Mollie could not release the authorization ${intentID}: ${response.status} ${await response.text()}`
      );
    }
  }

  private authorizationState(payment: Payment): AuthorizationState {
    const metadata = payment.metadata as MolliePaymentMetadata;
    const state = mapMollieAuthorizationStatus(payment.status);

    return {
      changeID: metadata.changeID ?? '',
      state,
      customerID:
        state === 'authorized' ? (payment.customerId ?? undefined) : undefined,
      intentData: JSON.stringify(payment),
    };
  }
}
