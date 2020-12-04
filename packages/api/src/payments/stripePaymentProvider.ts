import {
  BasePaymentProvider,
  CheckIntentProps,
  CreateIntentProps,
  GetInvoiceIDFromWebhookProps,
  IntentArgs,
  IntentStatus,
  PaymentProviderProps,
  WebhookUpdatesProps
} from './paymentProvider'
import Stripe from 'stripe'

export interface StripePaymentProviderProps extends PaymentProviderProps {
  secretKey: string
  webhookEndpointSecret: string
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

  getInvoiceIDFromWebhook(props: GetInvoiceIDFromWebhookProps): string {
    const signature = props.headers['stripe-signature']
    const event = this.getWebhookEvent(props.body, signature)

    const intent = event.data.object as Stripe.PaymentIntent

    return intent.metadata.invoiceID ?? ''
  }

  async webhookUpdate(props: WebhookUpdatesProps): Promise<IntentStatus> {
    const signature = props.headers['stripe-signature']
    const event = this.getWebhookEvent(props.body, signature)

    if (!event.type.startsWith('payment_intent')) {
      throw new Error(`Can not handle ${event.type}`)
    }

    const intent = event.data.object as Stripe.PaymentIntent

    switch (event.type) {
      case 'payment_intent.succeeded': {
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

  // TODO: teste create Intent with this provider.
  // Error on Thursday was something about successURL should not be empty
  async createIntent(props: CreateIntentProps): Promise<IntentArgs> {
    const intent = await this.stripe.paymentIntents.create({
      amount: props.invoice.items.reduce(
        (prevItem, currentItem) => prevItem + currentItem.amount * currentItem.quantity,
        0
      ),
      currency: 'chf',
      // description: props.invoice.description, TODO: convert to text
      metadata: {
        invoiceID: props.invoice.id
      }
    })

    return {
      intentID: intent.id,
      amount: intent.amount,
      intentData: JSON.stringify(intent),
      open: true,
      successful: false
    }
  }

  async checkIntentStatus(props: CheckIntentProps): Promise<IntentStatus> {
    const intent = await this.stripe.paymentIntents.retrieve(props.payment.intentID)

    return {
      successful: intent.status === 'succeeded',
      open: intent.status === 'succeeded' || intent.status === 'canceled',
      paymentData: JSON.stringify(intent)
    }
  }
}
