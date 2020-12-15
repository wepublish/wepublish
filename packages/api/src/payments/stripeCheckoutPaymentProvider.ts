import {
  BasePaymentProvider,
  CheckIntentProps,
  CreateIntentProps,
  IntentArgs,
  PaymentProviderProps,
  IntentStatus,
  WebhookUpdatesProps,
  GetInvoiceIDFromWebhookProps
} from './paymentProvider'
import Stripe from 'stripe'

export interface StripeCheckoutPaymentProviderProps extends PaymentProviderProps {
  secretKey: string
  webhookEndpointSecret: string
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

  getInvoiceIDFromWebhook(props: GetInvoiceIDFromWebhookProps): string {
    const signature = props.headers['stripe-signature']
    const event = this.getWebhookEvent(props.body, signature)

    const session = event.data.object as Stripe.Checkout.Session

    return session.client_reference_id ?? ''
  }

  async webhookUpdate(props: WebhookUpdatesProps): Promise<IntentStatus> {
    const signature = props.headers['stripe-signature']
    const event = this.getWebhookEvent(props.body, signature)

    if (!event.type.startsWith('checkout.session')) throw new Error(`Can not handle ${event.type}`)

    const session = event.data.object as Stripe.Checkout.Session

    switch (event.type) {
      case 'checkout.session.completed': {
        const intent = await this.stripe.paymentIntents.retrieve(session.payment_intent as string)
        return {
          successful: intent.status === 'succeeded',
          open: false,
          paymentData: JSON.stringify(intent)
        }
      }
      default: {
        return {
          successful: false,
          open: true
        }
      }
    }
  }

  async createIntent(props: CreateIntentProps): Promise<IntentArgs> {
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
      success_url: props.successURL ?? '',
      cancel_url: props.failureURL ?? '',
      client_reference_id: props.invoice.id,
      customer_email: props.invoice.mail
    })

    if (session.amount_total === null) {
      throw new Error('Error amount_total can not be null')
    }

    return {
      intentID: session.id,
      intentSecret: session.id,
      amount: session.amount_total,
      intentData: JSON.stringify(session),
      open: true,
      successful: false
    }
  }

  async checkIntentStatus(props: CheckIntentProps): Promise<IntentStatus> {
    // TODO: fix this
    const intent = await this.stripe.paymentIntents.retrieve(props.payment.intentID)

    return {
      successful: intent.status === 'succeeded',
      open: intent.status === 'succeeded' || intent.status === 'canceled',
      paymentData: JSON.stringify(intent)
    }
  }
}
