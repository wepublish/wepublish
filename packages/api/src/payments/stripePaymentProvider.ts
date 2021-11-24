import {
  BasePaymentProvider,
  CheckIntentProps,
  CreatePaymentIntentProps,
  Intent,
  IntentState,
  PaymentProviderProps,
  WebhookForPaymentIntentProps
} from './paymentProvider'
import Stripe from 'stripe'
import {PaymentState} from '../db/payment'
import {logger} from '../server'

export interface StripePaymentProviderProps extends PaymentProviderProps {
  secretKey: string
  webhookEndpointSecret: string
}

function mapStripeEventToPaymentStatue(event: string): PaymentState | null {
  switch (event) {
    case 'requires_payment_method':
    case 'requires_confirmation':
    case 'requires_action':
      return PaymentState.RequiresUserAction
    case 'processing':
      return PaymentState.Processing
    case 'succeeded':
      return PaymentState.Paid
    case 'canceled':
      return PaymentState.Canceled
    default:
      return null
  }
}

export class StripePaymentProvider extends BasePaymentProvider {
  readonly stripe: Stripe
  readonly webhookEndpointSecret: string

  constructor(props: StripePaymentProviderProps) {
    super(props)
    this.stripe = new Stripe(props.secretKey, {
      apiVersion: '2020-08-27'
    })
    this.webhookEndpointSecret = props.webhookEndpointSecret
  }

  getWebhookEvent(body: any, signature: string): Stripe.Event {
    return this.stripe.webhooks.constructEvent(body, signature, this.webhookEndpointSecret)
  }

  async webhookForPaymentIntent(props: WebhookForPaymentIntentProps): Promise<IntentState[]> {
    const signature = props.req.headers['stripe-signature'] as string
    const event = this.getWebhookEvent(props.req.body, signature)

    if (!event.type.startsWith('payment_intent')) {
      throw new Error(`Can not handle ${event.type}`)
    }

    const intent = event.data.object as Stripe.PaymentIntent
    const intentStates: IntentState[] = []
    const state = mapStripeEventToPaymentStatue(intent.status)
    if (state !== null && intent.metadata.paymentID !== undefined) {
      let customerID
      if (
        intent.setup_future_usage === 'off_session' &&
        intent.customer === null &&
        intent.payment_method !== null
      ) {
        const customer = await this.stripe.customers.create({
          email: intent.metadata.mail ?? '',
          payment_method: intent.payment_method as string,
          invoice_settings: {
            default_payment_method: intent.payment_method as string
          }
        })
        customerID = customer.id
      }
      intentStates.push({
        paymentID: intent.metadata.paymentID,
        paymentData: JSON.stringify(intent),
        state,
        customerID
      })
    }
    return intentStates
  }

  async createIntent({
    customerID,
    invoice,
    saveCustomer,
    paymentID
  }: CreatePaymentIntentProps): Promise<Intent> {
    let paymentMethodID: string | null = null
    if (customerID) {
      // For an off_session payment the default_payment_method of the customer will be used.
      // If no user, deleted user or no default_payment_method the intent will be created without an customer.
      const customer = await this.stripe.customers.retrieve(customerID)
      if (customer.deleted) {
        logger('stripePaymentProvider').warn(
          'Provided customerID "%s" returns a deleted stripe customer',
          customerID
        )
      } else if (customer.invoice_settings.default_payment_method !== null) {
        paymentMethodID = customer.invoice_settings.default_payment_method as string
      } else {
        logger('stripePaymentProvider').warn(
          'Provided customerID "%s" has no default_payment_method',
          customerID
        )
      }
    }

    const intent = await this.stripe.paymentIntents.create({
      amount: invoice.items.reduce(
        (prevItem, currentItem) => prevItem + currentItem.amount * currentItem.quantity,
        0
      ),
      ...(customerID && paymentMethodID
        ? {
            confirm: true,
            customer: customerID,
            off_session: true,
            payment_method: paymentMethodID,
            payment_method_types: ['card']
          }
        : {}),
      currency: 'chf',
      // description: props.invoice.description, TODO: convert to text
      ...(saveCustomer ? {setup_future_usage: 'off_session'} : {}),
      metadata: {
        paymentID: paymentID,
        mail: invoice.mail
      }
    })

    const state = mapStripeEventToPaymentStatue(intent.status)
    logger('stripePaymentProvider').info(
      'Created Stripe intent with ID: %s for paymentProvider %s',
      intent.id,
      this.id
    )

    return {
      intentID: intent.id,
      intentSecret: intent.client_secret ?? '',
      intentData: JSON.stringify(intent),
      state: state ?? PaymentState.Submitted
    }
  }

  async checkIntentStatus(props: CheckIntentProps): Promise<IntentState> {
    // TODO: fix this
    /* const intent = await this.stripe.paymentIntents.retrieve(props.payment.intentID)

    return {
      successful: intent.status === 'succeeded',
      open: intent.status === 'succeeded' || intent.status === 'canceled',
      paymentData: JSON.stringify(intent)
    } */
    return {
      state: PaymentState.Processing,
      paymentID: 'aasd'
    }
  }
}
