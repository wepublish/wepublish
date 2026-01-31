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
import { Gateway, GatewayStatus } from '../payrexx/gateway-client';
import { Transaction, TransactionStatus } from '../payrexx/transaction-client';
import { PayrexxFactory } from '../payrexx/payrexx-factory';
import {
  mapPayrexxPaymentMethods,
  mapPayrexxPSPs,
} from '../payment.methode.mapper';
export class PayrexxPaymentProvider extends BasePaymentProvider {
  payrexxFactory = PayrexxFactory;

  constructor(props: PaymentProviderProps) {
    super(props);
  }

  public overridePayrexxFactory(payrexxFactory: typeof PayrexxFactory) {
    this.payrexxFactory = payrexxFactory;
  }

  async getPayrexxGateway() {
    const config = await this.getConfig();
    if (!config.apiKey || !config.payrexx_instancename) {
      throw new Error('Payrexx missing api key or instance name missing');
    }
    return new this.payrexxFactory({
      baseUrl: 'https://api.payrexx.com/v1.0/',
      instance: config.payrexx_instancename,
      secret: config.apiKey,
    });
  }

  async webhookForPaymentIntent(
    props: WebhookForPaymentIntentProps
  ): Promise<WebhookResponse> {
    const apiKey = props.req.query?.['apiKey'] as string;
    const config = await this.getConfig();

    if (
      !this.timeConstantCompare(
        apiKey,
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

    const contentType = props.req.headers['content-type'];
    if (
      contentType !== 'application/json' ||
      typeof props.req.body === 'string'
    ) {
      return {
        status: 415,
        message:
          'Request does not contain valid json. Is Payrexx wrongly configured to send a PHP-Post?',
      };
    }

    if (!props.req.body.transaction) {
      return {
        status: 200,
        message: 'Skipping non-transaction webhook',
      };
    }

    const transaction = props.req.body.transaction as Transaction;

    if (transaction.subscription) {
      return {
        status: 200,
        message: 'Skipping transaction related to subscription',
      };
    }

    const state = this.mapPayrexxEventToPaymentStatus(transaction.status);

    if (state === null) {
      return {
        status: 200,
        paymentStates: [],
      };
    }

    const intentState: IntentState = {
      paymentID: transaction.referenceId,
      paymentData: JSON.stringify(transaction),
      state,
    };

    if (state === 'paid' && transaction.preAuthorizationId) {
      intentState.customerID = String(transaction.preAuthorizationId);
    }

    return {
      status: 200,
      paymentStates: [intentState],
    };
  }

  async createIntent(
    createPaymentIntentProps: CreatePaymentIntentProps
  ): Promise<Intent> {
    if (createPaymentIntentProps.customerID) {
      const offsiteTransactionIntent =
        await this.createOffsiteTransactionIntent(createPaymentIntentProps);

      if (offsiteTransactionIntent.state === 'paid') {
        return offsiteTransactionIntent;
      }
    }

    return this.createGatewayIntent(createPaymentIntentProps);
  }

  async checkIntentStatus({
    intentID,
  }: CheckIntentProps): Promise<IntentState> {
    const payrexx = await this.getPayrexxGateway();
    const transaction =
      await payrexx.transactionClient.retrieveTransaction(intentID);

    if (transaction) {
      return this.checkTransactionIntentStatus(transaction);
    }

    const gateway = await payrexx.gatewayClient.getGateway(intentID);

    if (gateway) {
      return this.checkGatewayIntentStatus(gateway);
    }

    logger('payrexxPaymentProvider').error(
      'No Payrexx Gateway nor Transaction with intendID: %s for paymentProvider %s found',
      intentID,
      this.id
    );

    throw new Error('Payrexx Gateway/Transaction not found');
  }

  private async createOffsiteTransactionIntent({
    customerID,
    invoice,
    paymentID,
    successURL,
    backgroundTask,
  }: CreatePaymentIntentProps): Promise<Intent> {
    const amount = invoice.items.reduce(
      (accumulator, { amount, quantity }) => accumulator + amount * quantity,
      0
    );

    let transaction: Transaction;
    try {
      if (!customerID) {
        throw new Error('No customerID given');
      }
      const payrexx = await this.getPayrexxGateway();

      transaction =
        await payrexx.transactionClient.chargePreAuthorizedTransaction(
          +customerID,
          {
            amount,
            referenceId: paymentID,
          }
        );
    } catch (e) {
      if (backgroundTask) {
        throw e;
      }

      transaction = this.createErroredPreAuthorizedTransaction();
    }

    const state = this.mapPayrexxEventToPaymentStatus(transaction.status);

    if (state === null) {
      throw new Error('Invalid payrexx transaction status');
    }

    return {
      intentID: transaction.id.toString(),
      intentSecret: successURL ?? '',
      intentData: JSON.stringify(transaction),
      state,
    };
  }

  private async createGatewayIntent({
    invoice,
    currency,
    paymentID,
    successURL,
    failureURL,
  }: CreatePaymentIntentProps) {
    const amount = invoice.items.reduce(
      (accumulator, { amount, quantity }) => accumulator + amount * quantity,
      0
    );

    let tokenization: {
      preAuthorization?: boolean;
      chargeOnAuthorization?: boolean;
    } = {};
    if (await this.isOffSession()) {
      tokenization = {
        preAuthorization: true,
        chargeOnAuthorization: true,
      };
    }
    const payrexx = await this.getPayrexxGateway();
    const config = await this.getConfig();
    const gateway = await payrexx.gatewayClient.createGateway({
      psp: mapPayrexxPSPs(config.payrexx_psp),
      pm: mapPayrexxPaymentMethods(config.payrexx_pm),
      referenceId: paymentID,
      amount,
      fields: {
        email: {
          value: invoice.mail,
        },
      },
      successRedirectUrl: successURL as string,
      failedRedirectUrl: failureURL as string,
      cancelRedirectUrl: failureURL as string,
      vatRate: this.assertProperty(
        'payrexx_vatrate',
        config.payrexx_vatrate
      ).toNumber(),
      currency,
      ...tokenization,
    });

    logger('payrexxPaymentProvider').info(
      'Created Payrexx intent with ID: %s for paymentProvider %s',
      gateway.id,
      this.id
    );

    return {
      intentID: gateway.id.toString(),
      intentSecret: gateway.link,
      intentData: JSON.stringify(gateway),
      state: PaymentState.submitted,
    };
  }

  private checkTransactionIntentStatus(transaction: Transaction): IntentState {
    const state = this.mapPayrexxEventToPaymentStatus(transaction.status);

    if (!state) {
      logger('payrexxPaymentProvider').error(
        'Payrexx gateway with ID: %s for paymentProvider %s returned with an unmappable status %s',
        transaction.id,
        this.id,
        transaction.status
      );

      throw new Error('Unmappable Payrexx transaction status');
    }

    if (!transaction.referenceId) {
      logger('payrexxPaymentProvider').error(
        'Payrexx transaction with ID: %s for paymentProvider %s returned with empty referenceId',
        transaction.id,
        this.id
      );

      throw new Error('empty referenceId');
    }

    return {
      state,
      paymentID: transaction.referenceId,
      paymentData: JSON.stringify(transaction),
    };
  }

  private checkGatewayIntentStatus(gateway: Gateway): IntentState {
    const state = this.mapPayrexxEventToPaymentStatus(gateway.status);
    if (!state) {
      logger('payrexxPaymentProvider').error(
        'Payrexx gateway with ID: %s for paymentProvider %s returned with an unmappable status %s',
        gateway.id,
        this.id,
        gateway.status
      );
      throw new Error('Unmappable Payrexx gateway status');
    }

    const transaction = gateway.invoices[0]?.transactions[0];
    if (!transaction) {
      logger('payrexxPaymentProvider').error(
        'Payrexx gateway with ID: %s for paymentProvider %s returned without transaction despite preAuthorization set to true.',
        gateway.id,
        this.id
      );
    }

    if (!gateway.referenceId) {
      logger('payrexxPaymentProvider').error(
        'Payrexx gateway with ID: %s for paymentProvider %s returned with empty referenceId',
        gateway.id,
        this.id
      );
      throw new Error('empty referenceId');
    }

    return {
      state,
      paymentID: gateway.referenceId,
      paymentData: JSON.stringify(gateway),
      customerID:
        transaction?.preAuthorizationId ?
          transaction.preAuthorizationId.toString()
        : undefined,
    };
  }

  private mapPayrexxEventToPaymentStatus(
    event: GatewayStatus | TransactionStatus
  ): PaymentState | null {
    switch (event) {
      case 'waiting':
        return PaymentState.processing;
      case 'confirmed':
        return PaymentState.paid;
      case 'cancelled':
        return PaymentState.canceled;
      case 'declined':
        return PaymentState.declined;
      default:
        return null;
    }
  }

  private createErroredPreAuthorizedTransaction(): Transaction {
    return {
      id: -1,
      uuid: '',
      referenceId: '',
      time: '',
      status: 'declined',
      lang: '',
      psp: '',
      amount: 0,
      subscription: null,
    };
  }
}
