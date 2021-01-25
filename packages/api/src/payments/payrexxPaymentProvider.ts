import {
  BasePaymentProvider,
  CheckIntentProps,
  CreatePaymentIntentProps,
  Intent,
  IntentState,
  PaymentProviderProps,
  WebhookForPaymentIntentProps
} from './paymentProvider'
import fetch from 'cross-fetch'
import crypto from 'crypto'
import {PaymentState} from '../db/payment'
import qs from 'qs'
import {logger} from '../server'

export interface PayrexxPaymentProviderProps extends PaymentProviderProps {
  instanceName: string
  instanceAPISecret: string
  psp: number[]
  pm: string[]
  vatRate: number
}

function mapPayrexxEventToPaymentStatue(event: string): PaymentState | null {
  switch (event) {
    case 'waiting':
      return PaymentState.Processing
    case 'confirmed':
      return PaymentState.Paid
    case 'cancelled':
      return PaymentState.Canceled
    case 'declined':
      return PaymentState.Declined
    default:
      return null
  }
}

export class PayrexxPaymentProvider extends BasePaymentProvider {
  readonly instanceName: string
  readonly instanceAPISecret: string
  readonly psp: number[]
  readonly pm: string[]
  readonly vatRate: number

  constructor(props: PayrexxPaymentProviderProps) {
    super(props)
    this.instanceName = props.instanceName
    this.instanceAPISecret = props.instanceAPISecret
    this.psp = props.psp
    this.pm = props.pm
    this.vatRate = props.vatRate
  }

  async webhookForPaymentIntent(props: WebhookForPaymentIntentProps): Promise<IntentState[]> {
    // TODO: verify webhook
    const intentStates: IntentState[] = []
    const transaction = props.req.body.transaction
    if (!transaction) throw new Error('Can not handle webhook')

    const state = mapPayrexxEventToPaymentStatue(transaction.status)
    if (state !== null) {
      intentStates.push({
        paymentID: transaction.referenceId,
        paymentData: JSON.stringify(transaction),
        state
      })
    }
    return intentStates
  }

  async createIntent(props: CreatePaymentIntentProps): Promise<Intent> {
    const data = {
      // purpose: ' Test Purpose',
      psp: this.psp,
      pm: this.pm,
      referenceId: props.paymentID,
      amount: props.invoice.items.reduce(
        (prevItem, currentItem) => prevItem + currentItem.amount * currentItem.quantity,
        0
      ),
      successRedirectUrl: props.successURL,
      failedRedirectUrl: props.failureURL,
      cancelRedirectUrl: props.failureURL,
      vatRate: this.vatRate,
      currency: 'CHF'
    }
    const signature = crypto
      .createHmac('sha256', this.instanceAPISecret)
      .update(qs.stringify(data))
      .digest('base64')

    const res = await fetch(`https://api.payrexx.com/v1.0/Gateway/?instance=${this.instanceName}`, {
      method: 'POST',
      body: qs.stringify({...data, ApiSignature: signature})
    })
    if (res.status !== 200) throw new Error(`Payrexx response is NOK with status ${res.status}`)
    const payrexxResponse = await res.json()

    logger('payrexxPaymentProvider').info(
      'Created Payrexx intent with ID: %s for paymentProvider %s',
      payrexxResponse.data?.[0].id,
      this.id
    )

    return {
      intentID: payrexxResponse.data?.[0].id,
      intentSecret: payrexxResponse.data?.[0].link,
      intentData: JSON.stringify(payrexxResponse.data),
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
