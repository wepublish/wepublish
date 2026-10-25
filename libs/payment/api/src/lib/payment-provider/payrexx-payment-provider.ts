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
import { Logger } from '@nestjs/common';
import { PaymentState } from '@prisma/client';
import { Gateway, GatewayStatus } from '../payrexx/gateway-client';
import { Transaction, TransactionStatus } from '../payrexx/transaction-client';
import { PayrexxFactory } from '../payrexx/payrexx-factory';
import {
  mapPayrexxPaymentMethods,
  mapPayrexxPSPs,
} from '../payment.methode.mapper';
export class PayrexxPaymentProvider extends BasePaymentProvider {
  private readonly logger = new Logger(PayrexxPaymentProvider.name);
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
    const config = await this.getConfig();

    const key =
      (props.req.query?.['key'] as string) ??
      (props.req.query?.['apiKey'] as string);

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
  }: CheckIntentProps): Promise<IntentState | null> {
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

    this.logger.error(
      `No Payrexx Gateway nor Transaction with intendID: ${intentID} for paymentProvider ${this.id} found`
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

    this.logger.log(
      `Created Payrexx intent with ID: ${gateway.id} for paymentProvider ${this.id}`
    );

    return {
      intentID: gateway.id.toString(),
      intentSecret: gateway.link,
      intentData: JSON.stringify(gateway),
      state: PaymentState.submitted,
    };
  }

  private checkTransactionIntentStatus(
    transaction: Transaction
  ): IntentState | null {
    const state = this.mapPayrexxEventToPaymentStatus(transaction.status);

    if (!state) {
      this.logger.warn(
        `Payrexx transaction with ID: ${transaction.id} for paymentProvider ${this.id} returned with an unhandled status ${transaction.status}, skipping`
      );

      return null;
    }

    if (!transaction.referenceId) {
      this.logger.error(
        `Payrexx transaction with ID: ${transaction.id} for paymentProvider ${this.id} returned with empty referenceId`
      );

      throw new Error('empty referenceId');
    }

    return {
      state,
      paymentID: transaction.referenceId,
      paymentData: JSON.stringify(transaction),
    };
  }

  private checkGatewayIntentStatus(gateway: Gateway): IntentState | null {
    const state = this.mapPayrexxEventToPaymentStatus(gateway.status);
    if (!state) {
      this.logger.warn(
        `Payrexx gateway with ID: ${gateway.id} for paymentProvider ${this.id} returned with an unhandled status ${gateway.status}, skipping`
      );
      return null;
    }

    const transaction = gateway.invoices[0]?.transactions[0];
    if (!transaction) {
      this.logger.error(
        `Payrexx gateway with ID: ${gateway.id} for paymentProvider ${this.id} returned without transaction despite preAuthorization set to true.`
      );
    }

    if (!gateway.referenceId) {
      this.logger.error(
        `Payrexx gateway with ID: ${gateway.id} for paymentProvider ${this.id} returned with empty referenceId`
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
      case 'chargeback':
        return PaymentState.chargeback;
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
