import {
  BasePaymentProvider,
  CheckPaymentProps,
  CreatePaymentProps,
  PaymentArgs,
  PaymentProviderProps,
  PaymentStatus
} from './paymentProvider'
import Stripe from 'stripe'

export interface StripePaymentProviderProps extends PaymentProviderProps {
  secretKey: string
}

export class StripePaymentProvider extends BasePaymentProvider {
  readonly stripe: Stripe

  constructor(props: StripePaymentProviderProps) {
    super(props)
    this.stripe = new Stripe(props.secretKey, {
      apiVersion: '2020-08-27'
    })
  }

  getPaymentIDFromWebhook(data: any): string {
    return ''
  }

  async webhookUpdate(props: CheckPaymentProps): Promise<PaymentStatus> {
    const session = props.payment.intentData as Stripe.Checkout.Session
    if (session?.payment_intent === null) {
      throw new Error('Payment Intent is null')
    }
    const intent = await this.stripe.paymentIntents.retrieve(session.payment_intent as string)

    return {
      payment: props.payment,
      successful: intent.status === 'succeeded',
      open: intent.status === 'succeeded' || intent.status === 'canceled',
      paymentData: intent
    }
  }

  async createPayment(props: CreatePaymentProps): Promise<PaymentArgs> {
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
      amount: session.amount_total,
      intentData: session,
      open: true,
      successful: false
    }
  }

  async checkPaymentStatus(props: CheckPaymentProps): Promise<PaymentStatus> {
    const session = props.payment.intentData as Stripe.Checkout.Session
    if (session?.payment_intent === null) {
      throw new Error('Payment Intent is null')
    }
    const intent = await this.stripe.paymentIntents.retrieve(session.payment_intent as string)

    return {
      payment: props.payment,
      successful: intent.status === 'succeeded',
      open: intent.status === 'succeeded' || intent.status === 'canceled',
      paymentData: intent
    }
  }
}
