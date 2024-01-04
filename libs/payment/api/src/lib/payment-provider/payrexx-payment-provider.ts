import {
  BasePaymentProvider,
  CheckIntentProps,
  CreatePaymentIntentProps,
  Intent,
  IntentState,
  PaymentProviderProps,
  WebhookForPaymentIntentProps
} from './payment-provider'
import {logger} from '@wepublish/utils/api'
import {PaymentState} from '@prisma/client'
import {Gateway, GatewayClient, GatewayStatus} from '../payrexx/gateway-client'
import {Transaction, TransactionClient, TransactionStatus} from '../payrexx/transaction-client'

export interface PayrexxPaymentProviderProps extends PaymentProviderProps {
  gatewayClient: GatewayClient
  transactionClient: TransactionClient
  psp: number[]
  pm: string[]
  vatRate: number
}

function mapPayrexxEventToPaymentStatus(
  event: GatewayStatus | TransactionStatus
): PaymentState | null {
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
  readonly gatewayClient: GatewayClient
  readonly transactionClient: TransactionClient
  readonly psp: number[]
  readonly pm: string[]
  readonly vatRate: number

  constructor(props: PayrexxPaymentProviderProps) {
    super(props)
    this.gatewayClient = props.gatewayClient
    this.transactionClient = props.transactionClient
    this.psp = props.psp
    this.pm = props.pm
    this.vatRate = props.vatRate
  }

  async webhookForPaymentIntent(props: WebhookForPaymentIntentProps): Promise<IntentState[]> {
    if (!props.req.body.transaction) {
      throw new Error('Cannot find Transaction within webhook body')
    }
    const transaction = props.req.body.transaction as Transaction
    const state = mapPayrexxEventToPaymentStatus(transaction.status)
    if (state === null) {
      return []
    }
    const intentState: IntentState = {
      paymentID: transaction.referenceId,
      paymentData: JSON.stringify(transaction),
      state
    }
    if (state === 'paid') {
      intentState.customerID = String(transaction.preAuthorizationId)
    }
    return [intentState]
  }

  async createIntent(createPaymentIntentProps: CreatePaymentIntentProps): Promise<Intent> {
    if (createPaymentIntentProps.customerID) {
      return this.createOffsiteTransactionIntent(createPaymentIntentProps)
    } else {
      return this.createGatewayIntent(createPaymentIntentProps)
    }
  }

  async checkIntentStatus({intentID}: CheckIntentProps): Promise<IntentState> {
    const transaction = await this.transactionClient.retrieveTransaction(intentID)
    if (transaction) {
      return this.checkTransactionIntentStatus(transaction)
    }

    const gateway = await this.gatewayClient.getGateway(intentID)
    if (gateway) {
      return this.checkGatewayIntentStatus(gateway)
    }

    logger('payrexxPaymentProvider').error(
      'No Payrexx Gateway nor Transaction with intendID: %s for paymentProvider %s found',
      intentID,
      this.id
    )
    throw new Error('Payrexx Gateway/Transaction not found')
  }

  x

  private async createOffsiteTransactionIntent({
    customerID,
    invoice,
    paymentID
  }: CreatePaymentIntentProps) {
    const amount = invoice.items.reduce(
      (accumulator, {amount, quantity}) => accumulator + amount * quantity,
      0
    )
    const transaction = await this.transactionClient.chargePreAuthorizedTransaction(
      parseInt(customerID),
      {
        amount,
        referenceId: paymentID
      }
    )
    return {
      intentID: transaction.id.toString(),
      intentSecret: '',
      intentData: JSON.stringify(transaction),
      state: PaymentState.submitted
    }
  }

  private async createGatewayIntent({
    invoice,
    paymentID,
    successURL,
    failureURL
  }: CreatePaymentIntentProps) {
    const amount = invoice.items.reduce(
      (accumulator, {amount, quantity}) => accumulator + amount * quantity,
      0
    )
    const gateway = await this.gatewayClient.createGateway({
      psp: this.psp,
      pm: this.pm,
      referenceId: paymentID,
      amount,
      fields: {
        email: {
          value: invoice.mail
        }
      },
      successRedirectUrl: successURL,
      failedRedirectUrl: failureURL,
      cancelRedirectUrl: failureURL,
      vatRate: this.vatRate,
      currency: 'CHF',
      preAuthorization: true,
      chargeOnAuthorization: true
    })
    logger('payrexxPaymentProvider').info(
      'Created Payrexx intent with ID: %s for paymentProvider %s',
      gateway.id,
      this.id
    )
    return {
      intentID: gateway.id.toString(),
      intentSecret: gateway.link,
      intentData: JSON.stringify(gateway),
      state: PaymentState.submitted
    }
  }

  private checkTransactionIntentStatus(transaction: Transaction): IntentState {
    const state = mapPayrexxEventToPaymentStatus(transaction.status)
    if (!state) {
      logger('payrexxPaymentProvider').error(
        'Payrexx gateway with ID: %s for paymentProvider %s returned with an unmappable status %s',
        transaction.id,
        this.id,
        transaction.status
      )
      throw new Error('Unmappable Payrexx gateway status')
    }

    if (!transaction.referenceId) {
      logger('payrexxPaymentProvider').error(
        'Payrexx transaction with ID: %s for paymentProvider %s returned with empty referenceId',
        transaction.id,
        this.id
      )
      throw new Error('empty referenceId')
    }

    return {
      state,
      paymentID: transaction.referenceId,
      paymentData: JSON.stringify(transaction)
    }
  }

  private checkGatewayIntentStatus(gateway: Gateway): IntentState {
    const state = mapPayrexxEventToPaymentStatus(gateway.status)
    if (!state) {
      logger('payrexxPaymentProvider').error(
        'Payrexx gateway with ID: %s for paymentProvider %s returned with an unmappable status %s',
        gateway.id,
        this.id,
        gateway.status
      )
      throw new Error('Unmappable Payrexx gateway status')
    }

    const transaction = gateway.invoices[0]?.transactions[0]
    if (!transaction) {
      logger('payrexxPaymentProvider').error(
        'Payrexx gateway with ID: %s for paymentProvider %s returned without transaction despite preAuthorization set to true.',
        gateway.id,
        this.id
      )
      throw new Error('No Payrexx transaction associated with the gateway ')
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
      paymentData: JSON.stringify(gateway),
      customerID: transaction.preAuthorizationId?.toString()
    }
  }
}
