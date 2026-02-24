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
import Stripe from 'stripe';
import { logger } from '@wepublish/utils/api';
import { PaymentState } from '@prisma/client';
import { mapStripePaymentMethodTypes } from '../payment.methode.mapper';

interface CreateStripeCustomerProps {
  intent: Stripe.PaymentIntent;
}

function mapStripeEventToPaymentStatus(event: string): PaymentState | null {
  switch (event) {
    case 'requires_payment_method':
    case 'requires_confirmation':
    case 'requires_action':
      return PaymentState.requiresUserAction;
    case 'processing':
      return PaymentState.processing;
    case 'succeeded':
      return PaymentState.paid;
    case 'canceled':
      return PaymentState.canceled;
    default:
      return null;
  }
}

export class StripePaymentProvider extends BasePaymentProvider {
  constructor(props: PaymentProviderProps) {
    super(props);
  }

  async getStripeGateway() {
    const config = await this.getConfig();
    if (!config.apiKey) {
      throw new Error('Stripe missing api key');
    }
    return new Stripe(config.apiKey, {
      apiVersion: '2020-08-27',
    });
  }

  async createStripeCustomer({
    intent,
  }: CreateStripeCustomerProps): Promise<string> {
    const stripe = await this.getStripeGateway();
    const customer = await stripe.customers.create({
      email: intent.metadata['mail'] ?? '',
      payment_method: intent.payment_method as string,
      invoice_settings: {
        default_payment_method: intent.payment_method as string,
      },
    });
    return customer.id;
  }

  async getWebhookEvent(body: any, signature: string): Promise<Stripe.Event> {
    const config = await this.getConfig();
    const stripe = await this.getStripeGateway();
    return stripe.webhooks.constructEvent(
      body,
      signature,
      this.assertProperty('webhookEndpointSecret', config.webhookEndpointSecret)
    );
  }

  async webhookForPaymentIntent(
    props: WebhookForPaymentIntentProps
  ): Promise<WebhookResponse> {
    const signature = props.req.headers['stripe-signature'] as string;
    const event = await this.getWebhookEvent(props.req.body, signature);

    if (!event.type.startsWith('payment_intent')) {
      return {
        status: 200,
        message: `Skipping handling ${event.type}`,
      };
    }

    const intent = event.data.object as Stripe.PaymentIntent;
    const intentStates: IntentState[] = [];
    const state = mapStripeEventToPaymentStatus(intent.status);
    if (state !== null && intent.metadata['paymentID'] !== undefined) {
      let customerID;

      if (
        intent.setup_future_usage === 'off_session' &&
        intent.customer === null &&
        intent.payment_method !== null
      ) {
        customerID = await this.createStripeCustomer({ intent });
      } else {
        customerID = intent.customer as string;
      }

      intentStates.push({
        paymentID: intent.metadata['paymentID'],
        paymentData: JSON.stringify(intent),
        state,
        customerID,
      });
    }
    return {
      status: 200,
      paymentStates: intentStates,
    };
  }

  private isCustomerDeleted(
    customer: Stripe.Customer | Stripe.DeletedCustomer
  ): customer is Stripe.DeletedCustomer {
    return !!customer.deleted;
  }

  async createIntent({
    customerID,
    invoice,
    saveCustomer,
    paymentID,
    currency,
  }: CreatePaymentIntentProps): Promise<Intent> {
    let paymentMethodID: string | null = null;
    const stripe = await this.getStripeGateway();
    if (customerID) {
      // For an off_session payment the default_payment_method or the default_source of the customer will be used.
      // If both are available the default_payment_method will be used.
      // If no user, deleted user, no default_payment_method or no default_source the intent will be created without an customer.
      const customer = await stripe.customers.retrieve(customerID);
      if (this.isCustomerDeleted(customer)) {
        logger('stripePaymentProvider').warn(
          'Provided customerID "%s" returns a deleted stripe customer',
          customerID
        );
      } else if (customer.invoice_settings.default_payment_method !== null) {
        paymentMethodID = customer.invoice_settings
          .default_payment_method as string;
      } else if (customer.default_source !== null) {
        paymentMethodID = customer.default_source as string;
      } else {
        logger('stripePaymentProvider').warn(
          'Provided customerID "%s" has no default_payment_method or default_source',
          customerID
        );
      }
    }
    let intent;
    let errorCode;
    try {
      const config = await this.getConfig();
      intent = await stripe.paymentIntents.create({
        amount: invoice.items.reduce(
          (prevItem, currentItem) =>
            prevItem + currentItem.amount * currentItem.quantity,
          0
        ),
        ...(customerID && paymentMethodID ?
          {
            confirm: true,
            customer: customerID,
            off_session: true,
            payment_method: paymentMethodID,
            payment_method_types: mapStripePaymentMethodTypes(
              config.stripe_methods
            ),
          }
        : {
            payment_method_types: mapStripePaymentMethodTypes(
              config.stripe_methods
            ),
          }),
        currency: currency.toLowerCase(),
        // description: props.invoice.description, TODO: convert to text
        ...(saveCustomer ? { setup_future_usage: 'off_session' } : {}),
        metadata: {
          paymentID,
          mail: invoice.mail,
        },
      });
    } catch (err) {
      const error: any = err;

      logger('stripePaymentProvider').error(
        error,
        'Error while creating Stripe Intent for paymentProvider %s',
        this.id
      );

      if (error.type === 'StripeCardError') {
        intent = error.raw.payment_intent;
        errorCode = error.raw.code;
      } else {
        intent = {
          id: 'unknown_error',
          error,
          state: PaymentState.requiresUserAction,
        };
        errorCode = 'unknown_error';
      }
    }

    const state = mapStripeEventToPaymentStatus(intent.status);
    logger('stripePaymentProvider').info(
      'Created Stripe intent with ID: %s for paymentProvider %s',
      intent.id,
      this.id
    );

    return {
      intentID: intent.id,
      intentSecret: intent.client_secret ?? '',
      intentData: JSON.stringify(intent),
      state: state ?? PaymentState.submitted,
      errorCode,
    };
  }

  async checkIntentStatus({
    intentID,
  }: CheckIntentProps): Promise<IntentState> {
    const stripe = await this.getStripeGateway();
    const intent = await stripe.paymentIntents.retrieve(intentID);
    const state = mapStripeEventToPaymentStatus(intent.status);

    if (!state) {
      logger('stripePaymentProvider').error(
        'Stripe intent with ID: %s for paymentProvider %s returned with an unknown state %s',
        intent.id,
        this.id,
        intent.status
      );
      throw new Error('unknown intent state');
    }

    if (!intent.metadata['paymentID']) {
      logger('stripePaymentProvider').error(
        'Stripe intent with ID: %s for paymentProvider %s returned with empty paymentID',
        intent.id,
        this.id
      );
      throw new Error('empty paymentID');
    }

    let customerID;
    if (
      intent.setup_future_usage === 'off_session' &&
      intent.customer === null &&
      intent.payment_method !== null
    ) {
      customerID = await this.createStripeCustomer({ intent });
    } else {
      customerID = intent.customer as string;
    }

    return {
      state,
      paymentID: intent.metadata['paymentID'],
      paymentData: JSON.stringify(intent),
      customerID,
    };
  }
}
