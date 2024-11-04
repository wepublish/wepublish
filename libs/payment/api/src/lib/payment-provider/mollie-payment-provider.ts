import {
  BasePaymentProvider,
  CheckIntentProps,
  CreatePaymentIntentProps,
  Intent,
  IntentState,
  InvoiceWithItems,
  PaymentProviderProps,
  WebhookForPaymentIntentProps,
  WebhookResponse
} from './payment-provider'
import {logger} from '@wepublish/utils/api'
import {PaymentState} from '@prisma/client'
import createMollieClient, {
  MollieClient,
  SequenceType,
  Payment,
  PaymentMethod
} from '@mollie/api-client'
import MaybeArray from '@mollie/api-client/dist/types/types/MaybeArray'

export interface MolliePaymentProviderProps extends PaymentProviderProps {
  apiKey: string
  webhookEndpointSecret: string
  apiBaseUrl: string
  method?: MaybeArray<PaymentMethod>
}

const erroredPaymentIntent = {
  intentID: 'error',
  intentSecret: '',
  intentData: 'error',
  state: PaymentState.requiresUserAction,
  errorCode: 'error'
}

type MolliePaymentMetadata = {
  paymentID?: string
  mail?: string
}

function mapMollieEventToPaymentStatus(event: string): PaymentState | null {
  switch (event) {
    case 'failed':
    case 'expired':
      return PaymentState.requiresUserAction
    case 'open':
    case 'authorized':
    case 'pending':
      return PaymentState.processing
    case 'paid':
      return PaymentState.paid
    case 'canceled':
      return PaymentState.canceled
    default:
      return null
  }
}

function calculateAndFormatAmount(invoice: InvoiceWithItems) {
  return `${(
    invoice.items.reduce(
      (prevItem, currentItem) => prevItem + currentItem.amount * currentItem.quantity,
      0
    ) / 100
  ).toFixed(2)}`
}

export class MolliePaymentProvider extends BasePaymentProvider {
  readonly webhookEndpointSecret: string
  readonly mollieClient: MollieClient
  readonly apiBaseUrl: string
  readonly method: MaybeArray<PaymentMethod>

  constructor(props: MolliePaymentProviderProps) {
    super(props)
    this.webhookEndpointSecret = props.webhookEndpointSecret
    this.apiBaseUrl = props.apiBaseUrl
    this.mollieClient = createMollieClient({apiKey: props.apiKey})
    this.method = props.method
  }

  generateWebhookUrl(): string {
    return `${this.apiBaseUrl}/payment-webhooks/${this.id}?key=${this.webhookEndpointSecret}`
  }

  async webhookForPaymentIntent(props: WebhookForPaymentIntentProps): Promise<WebhookResponse> {
    const intentStates = []
    const key = props.req.query?.key as string

    if (!this.timeConstantCompare(key, this.webhookEndpointSecret)) {
      return {
        status: 403,
        message: 'Invalid Api Key'
      }
    }

    const molliePaymentId: string | undefined = props.req.body.id

    if (!molliePaymentId) {
      return {
        status: 200,
        paymentStates: intentStates
      }
    }
    const payment = await this.mollieClient.payments.get(molliePaymentId)
    const state = mapMollieEventToPaymentStatus(payment.status)
    const metadata: MolliePaymentMetadata = payment.metadata
    if (state && metadata.paymentID) {
      let customerID: undefined | string
      if (payment.customerId) customerID = payment.customerId

      intentStates.push({
        paymentID: metadata.paymentID,
        paymentData: JSON.stringify(payment),
        state,
        customerID
      })
    }
    return {
      status: 200,
      paymentStates: intentStates
    }
  }

  async createIntent(createPaymentIntentProps: CreatePaymentIntentProps): Promise<Intent> {
    if (this.offSessionPayments && createPaymentIntentProps.customerID) {
      const offsiteTransactionIntent = await this.createOffsiteTransactionIntent(
        createPaymentIntentProps
      )

      if (offsiteTransactionIntent.state === PaymentState.paid) {
        return offsiteTransactionIntent
      }
    }

    return this.createGatewayIntent(createPaymentIntentProps)
  }

  async createGatewayIntent({
    invoice,
    paymentID,
    currency,
    successURL
  }: CreatePaymentIntentProps): Promise<Intent> {
    let payment: Payment
    try {
      let customerId: undefined | string
      if (this.offSessionPayments) {
        const customer = await this.mollieClient.customers.create({
          email: invoice.mail,
          name: invoice.mail
        })
        customerId = customer.id
      }

      payment = await this.mollieClient.customerPayments.create({
        customerId,
        amount: {
          currency,
          value: calculateAndFormatAmount(invoice)
        },
        description: invoice.subscriptionID,
        redirectUrl: successURL,
        webhookUrl: this.generateWebhookUrl(),
        sequenceType: SequenceType.first,
        method: this.method,
        metadata: {
          paymentID,
          mail: invoice.mail
        }
      })
    } catch (err) {
      const error: any = err

      logger('molliePaymentProvider').error(
        error,
        'Error while creating Mollie Intent for paymentProvider %s',
        this.id
      )
      return erroredPaymentIntent
    }
    return {
      intentID: payment.id,
      intentSecret: payment.getCheckoutUrl() ?? '',
      intentData: JSON.stringify(payment),
      state: mapMollieEventToPaymentStatus(payment.status)
    }
  }

  async createOffsiteTransactionIntent({
    customerID,
    invoice,
    paymentID,
    currency,
    successURL
  }: CreatePaymentIntentProps): Promise<Intent> {
    let payment: Payment
    try {
      payment = await this.mollieClient.customerPayments.create({
        customerId: customerID,
        amount: {
          currency,
          value: calculateAndFormatAmount(invoice)
        },
        description: invoice.subscriptionID,
        redirectUrl: successURL,
        webhookUrl: this.generateWebhookUrl(),
        sequenceType: SequenceType.recurring,
        metadata: {
          paymentID,
          mail: invoice.mail
        }
      })
    } catch (err) {
      return erroredPaymentIntent
    }

    return {
      intentID: payment.id,
      intentSecret: payment.getCheckoutUrl() ?? '',
      intentData: JSON.stringify(payment),
      state: mapMollieEventToPaymentStatus(payment.status)
    }
  }

  async checkIntentStatus({intentID}: CheckIntentProps): Promise<IntentState> {
    const payment = await this.mollieClient.payments.get(intentID)
    const state = mapMollieEventToPaymentStatus(payment.status)

    if (!state) {
      logger('molliePaymentProvider').error(
        'Stripe intent with ID: %s for paymentProvider %s returned with an unknown state %s',
        payment.id,
        this.id,
        payment.status
      )
      throw new Error('unknown intent state')
    }

    const metadata: MolliePaymentMetadata = payment.metadata

    if (!metadata.paymentID) {
      logger('molliePaymentProvider').error(
        'Stripe intent with ID: %s for paymentProvider %s returned with empty paymentID',
        payment.id,
        this.id
      )
      throw new Error('empty paymentID')
    }

    return {
      state,
      paymentID: metadata.paymentID,
      paymentData: JSON.stringify(payment),
      customerID: payment.customerId ?? undefined
    }
  }
}
