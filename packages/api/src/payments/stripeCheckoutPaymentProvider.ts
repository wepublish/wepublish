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

export interface StripeCheckoutPaymentProviderProps extends PaymentProviderProps {
  secretKey: string
  webhookEndpointSecret: string
}

function mapStripeCheckoutEventToPaymentStatue(event: string): PaymentState | null {
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

export class StripeCheckoutPaymentProvider extends BasePaymentProvider {
  readonly stripe: Stripe
  readonly webhookEndpointSecret: string

  constructor(props: StripeCheckoutPaymentProviderProps) {
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

    if (!event.type.startsWith('checkout.session')) throw new Error(`Can not handle ${event.type}`)

    const session = event.data.object as Stripe.Checkout.Session
    const intentStates: IntentState[] = []
    switch (event.type) {
      case 'checkout.session.completed': {
        const intent = await this.stripe.paymentIntents.retrieve(session.payment_intent as string)
        const state = mapStripeCheckoutEventToPaymentStatue(intent.status)
        if (state !== null && session.client_reference_id !== null) {
          intentStates.push({
            paymentID: session.client_reference_id,
            paymentData: JSON.stringify(intent),
            state
          })
        }
      }
    }
    return intentStates
  }

  async createIntent(props: CreatePaymentIntentProps): Promise<Intent> {
    if (!props.successURL) throw new Error('SuccessURL is not defined')
    if (!props.failureURL) throw new Error('FailureURL is not defined')
    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: props.invoice.items.map(item => ({
        price_data: {
          currency: 'chf',
          product_data: {
            name: item.name
          },
          unit_amount: item.amount
        },
        quantity: item.quantity
      })),
      mode: 'payment',
      success_url: props.successURL,
      cancel_url: props.failureURL,
      client_reference_id: props.paymentID,
      customer_email: props.invoice.mail
    })

    if (session.amount_total === null) {
      throw new Error('Error amount_total can not be null')
    }
    logger('stripeCheckoutPaymentProvider').info(
      'Created Stripe checkout session with ID: %s for paymentProvider %s',
      session.id,
      this.id
    )
    return {
      intentID: session.id,
      intentSecret: session.id,
      intentData: JSON.stringify(session),
      state: PaymentState.Submitted
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
