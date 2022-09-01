import {
  BasePaymentProvider,
  CheckIntentProps,
  CreatePaymentIntentProps,
  Intent,
  IntentState,
  PaymentProviderProps,
  WebhookForPaymentIntentProps
} from './paymentProvider'
import fetch from 'node-fetch'
import crypto from 'crypto'
import qs from 'qs'
import {logger} from '../server'
import {PaymentState} from '@prisma/client'

export interface PayrexxPaymentProviderProps extends PaymentProviderProps {
  instanceName: string
  instanceAPISecret: string
  psp: number[]
  pm: string[]
  vatRate: number
}

interface PayrexxResponse {
  status: string
  message: string
  data: PayrexxData[]
}

interface PayrexxData {
  id: string
  link: string
}

function mapPayrexxEventToPaymentStatus(event: string): PaymentState | null {
  switch (event) {
    case 'waiting':
      return PaymentState.processing
    case 'confirmed':
      return PaymentState.paid
    case 'cancelled':
      return PaymentState.canceled
    case 'declined':
      return PaymentState.declined
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

    const state = mapPayrexxEventToPaymentStatus(transaction.status)
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
      psp: this.psp,
      pm: this.pm,
      referenceId: props.paymentID,
      amount: props.invoice.items.reduce(
        (prevItem, currentItem) => prevItem + currentItem.amount * currentItem.quantity,
        0
      ),
      fields: {
        email: {
          value: props.invoice.mail
        }
      },
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

    const res = await fetch(
      `https://api.payrexx.com/v1.0/Gateway/?instance=${encodeURIComponent(this.instanceName)}`,
      {
        method: 'POST',
        body: qs.stringify({...data, ApiSignature: signature})
      }
    )
    if (res.status !== 200) throw new Error(`Payrexx response is NOK with status ${res.status}`)
    const payrexxResponse = (await res.json()) as PayrexxResponse

    logger('payrexxPaymentProvider').info(
      'Created Payrexx intent with ID: %s for paymentProvider %s',
      payrexxResponse.data?.[0].id,
      this.id
    )
    // in case Payrexx throws an error
    if (payrexxResponse.status === 'error') {
      throw new Error(`Error from Payrexx: ${payrexxResponse.message}`)
    }

    return {
      intentID: payrexxResponse.data?.[0].id,
      intentSecret: payrexxResponse.data?.[0].link,
      intentData: JSON.stringify(payrexxResponse.data),
      state: PaymentState.submitted
    }
  }

  async checkIntentStatus({intentID}: CheckIntentProps): Promise<IntentState> {
    const signature = crypto.createHmac('sha256', this.instanceAPISecret).digest('base64')

    const res = await fetch(
      `https://api.payrexx.com/v1.0/Gateway/${encodeURIComponent(
        intentID
      )}/?instance=${encodeURIComponent(this.instanceName)}&ApiSignature=${encodeURIComponent(
        signature
      )}`,
      {
        method: 'GET'
      }
    )
    if (res.status !== 200) {
      logger('payrexxPaymentProvider').error(
        'Payrexx response for intent %s is NOK with status %s',
        intentID,
        res.status
      )
      throw new Error(`Payrexx response is NOK with status ${res.status}`)
    }

    const payrexxResponse = await res.json()
    const [gateway] = payrexxResponse.data
    if (!gateway) throw new Error(`Payrexx didn't return a gateway`)

    const state = mapPayrexxEventToPaymentStatus(gateway.status)

    if (!state) {
      logger('payrexxPaymentProvider').error(
        'Payrexx gateway with ID: %s for paymentProvider %s returned with an unknown state %s',
        gateway.id,
        this.id,
        gateway.status
      )
      throw new Error('unknown gateway state')
    }

    if (!gateway.referenceId) {
      logger('payrexxPaymentProvider').error(
        'Payrexx gateway with ID: %s for paymentProvider %s returned with empty referenceId',
        gateway.id,
        this.id
      )
      throw new Error('empty referenceId')
    }

    return {
      state,
      paymentID: gateway.referenceId,
      paymentData: JSON.stringify(gateway)
    }
  }
}
