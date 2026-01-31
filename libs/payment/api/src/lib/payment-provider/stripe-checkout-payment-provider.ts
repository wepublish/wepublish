import { PaymentState } from '@prisma/client';
import { logger } from '@wepublish/utils/api';
import Stripe from 'stripe';

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
import {
  mapStripePaymentMethodTypes,
  mapStripePaymentMethodTypesTyped,
} from '../payment.methode.mapper';

function mapStripeCheckoutEventToPaymentStatue(
  event: string
): PaymentState | null {
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

export class StripeCheckoutPaymentProvider extends BasePaymentProvider {
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

    if (!event.type.startsWith('checkout.session')) {
      return {
        status: 200,
        message: `Skipping handling ${event.type}`,
      };
    }

    const session = event.data.object as Stripe.Checkout.Session;
    const intentStates: IntentState[] = [];
    switch (event.type) {
      case 'checkout.session.completed': {
        const stripe = await this.getStripeGateway();
        const intent = await stripe.paymentIntents.retrieve(
          session.payment_intent as string
        );
        const state = mapStripeCheckoutEventToPaymentStatue(intent.status);
        if (state !== null && session.client_reference_id !== null) {
          intentStates.push({
            paymentID: session.client_reference_id,
            paymentData: JSON.stringify(intent),
            state,
          });
        }
      }
    }
    return {
      status: 200,
      paymentStates: intentStates,
    };
  }

  async createIntent(props: CreatePaymentIntentProps): Promise<Intent> {
    if (!props.successURL) throw new Error('SuccessURL is not defined');
    if (!props.failureURL) throw new Error('FailureURL is not defined');
    const stripe = await this.getStripeGateway();
    const config = await this.getConfig();
    const session = await stripe.checkout.sessions.create({
      payment_method_types: mapStripePaymentMethodTypesTyped(
        config.stripe_methods
      ),
      line_items: props.invoice.items.map(item => ({
        price_data: {
          currency: props.currency,
          product_data: {
            name: item.name,
          },
          unit_amount: item.amount,
        },
        quantity: item.quantity,
      })),
      mode: 'payment',
      success_url: props.successURL,
      cancel_url: props.failureURL,
      client_reference_id: props.paymentID,
      customer_email: props.invoice.mail,
    });

    if (session.amount_total === null) {
      throw new Error('Error amount_total can not be null');
    }
    logger('stripeCheckoutPaymentProvider').info(
      'Created Stripe checkout session with ID: %s for paymentProvider %s',
      session.id,
      this.id
    );

    if (session.url === null) {
      throw new Error('session url can not be null');
    }

    return {
      intentID: session.id,
      intentSecret: session.url,
      intentData: JSON.stringify(session),
      state: PaymentState.submitted,
    };
  }

  async checkIntentStatus({
    intentID,
  }: CheckIntentProps): Promise<IntentState> {
    const stripe = await this.getStripeGateway();
    const session = await stripe.checkout.sessions.retrieve(intentID);
    const state =
      session.payment_status === 'paid' ?
        PaymentState.paid
      : PaymentState.requiresUserAction;

    if (!session.client_reference_id) {
      logger('stripePaymentProvider').error(
        'Stripe checkout session with ID: %s for paymentProvider %s returned with client_reference_id',
        session.id,
        this.id
      );
      throw new Error('empty paymentID');
    }

    return {
      state,
      paymentID: session.client_reference_id,
      paymentData: JSON.stringify(session),
    };
  }
}
