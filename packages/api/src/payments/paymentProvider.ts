import express, {Router} from 'express'
import {contextFromRequest, DataLoaderContext} from '../context'
import {logger, WepublishServerOpts} from '../server'
import {Payment, PaymentState} from '../db/payment'
import {Invoice} from '../db/invoice'
import {NextHandleFunction} from 'connect'
import bodyParser from 'body-parser'
import {paymentModelEvents} from '../events'
import {DBAdapter} from '../db/adapter'
import {OptionalSubscription} from '../db/subscription'

export const PAYMENT_WEBHOOK_PATH_PREFIX = 'payment-webhooks'

export interface WebhookForPaymentIntentProps {
  req: express.Request
}

export interface IntentState {
  paymentID: string
  state: PaymentState
  paidAt?: Date
  paymentData?: string
  customerID?: string
}

export interface CreatePaymentIntentProps {
  paymentID: string
  invoice: Invoice
  saveCustomer: boolean
  customerID?: string
  successURL?: string
  failureURL?: string
}

export interface CheckIntentProps {
  intentID: string
}

export interface UpdatePaymentWithIntentStateProps {
  intentState: IntentState
  dbAdapter: DBAdapter
  loaders: DataLoaderContext
}

export interface WebhookUpdatesProps {
  payment: Payment
  body: any
  headers: any
}

export interface GetInvoiceIDFromWebhookProps {
  body: any
  headers: any
}

export interface Intent {
  intentID: string
  intentSecret: string
  state: PaymentState
  paidAt?: Date
  intentData?: string
  paymentData?: string
  errorCode?: string
}

export interface PaymentProvider {
  id: string
  name: string
  offSessionPayments: boolean

  incomingRequestHandler: NextHandleFunction

  webhookForPaymentIntent(props: WebhookForPaymentIntentProps): Promise<IntentState[]>

  createIntent(props: CreatePaymentIntentProps): Promise<Intent>

  checkIntentStatus(props: CheckIntentProps): Promise<IntentState>

  updatePaymentWithIntentState(props: UpdatePaymentWithIntentStateProps): Promise<Payment>
}

export interface PaymentProviderProps {
  id: string
  name: string
  offSessionPayments: boolean
  incomingRequestHandler?: NextHandleFunction
}

export abstract class BasePaymentProvider implements PaymentProvider {
  readonly id: string
  readonly name: string
  readonly offSessionPayments: boolean

  readonly incomingRequestHandler: NextHandleFunction

  protected constructor(props: PaymentProviderProps) {
    this.id = props.id
    this.name = props.name
    this.offSessionPayments = props.offSessionPayments
    this.incomingRequestHandler = props.incomingRequestHandler ?? bodyParser.json()
  }

  abstract webhookForPaymentIntent(props: WebhookForPaymentIntentProps): Promise<IntentState[]>

  abstract createIntent(props: CreatePaymentIntentProps): Promise<Intent>

  abstract checkIntentStatus(props: CheckIntentProps): Promise<IntentState>

  async updatePaymentWithIntentState({
    intentState,
    dbAdapter,
    loaders
  }: UpdatePaymentWithIntentStateProps): Promise<Payment> {
    const payment = await loaders.paymentsByID.load(intentState.paymentID)
    // TODO: should we overwrite already paid/canceled payments
    if (!payment) throw new Error(`Payment with ID ${intentState.paymentID} not found`)

    const updatedPayment = await dbAdapter.payment.updatePayment({
      id: payment.id,
      input: {
        state: intentState.state,
        paymentData: intentState.paymentData,
        intentData: payment.intentData,
        intentSecret: payment.intentSecret,
        intentID: payment.intentID,
        invoiceID: payment.invoiceID,
        paymentMethodID: payment.paymentMethodID
      }
    })

    if (!updatedPayment) throw new Error('Error while updating Payment')

    // get invoice and subscription joins out of the payment
    const invoice = await loaders.invoicesByID.load(payment.invoiceID)
    if (!invoice) throw new Error(`Invoice with ID ${payment.invoiceID} does not exist`)

    const subscription = await dbAdapter.subscription.getSubscriptionByID(invoice.subscriptionID)
    if (!subscription)
      throw new Error(`Subscription with ID ${invoice.subscriptionID} does not exist`)

    // update payment provider
    if (intentState.customerID && payment.invoiceID) {
      await this.updatePaymentProvider(dbAdapter, subscription, intentState.customerID)
    }
    return updatedPayment
  }

  /**
   * adding or updating paymentProvider customer ID for user
   * @param dbAdapter
   * @param subscription
   * @param customerID
   * @private
   */
  private async updatePaymentProvider(
    dbAdapter: DBAdapter,
    subscription: OptionalSubscription,
    customerID: string
  ) {
    if (!subscription) {
      throw new Error('Empty subscription within updatePaymentProvider method.')
    }

    const user = await dbAdapter.user.getUserByID(subscription.userID)
    if (!user) throw new Error(`User with ID ${subscription.userID} does not exist`)

    const paymentProviderCustomers = user.paymentProviderCustomers.filter(
      ppc => ppc.paymentProviderID !== this.id
    )
    paymentProviderCustomers.push({
      paymentProviderID: this.id,
      customerID
    })

    await dbAdapter.user.updatePaymentProviderCustomers({
      userID: user.id,
      paymentProviderCustomers
    })
  }
}

export function setupPaymentProvider(opts: WepublishServerOpts): Router {
  const {paymentProviders} = opts
  const paymentProviderWebhookRouter = Router()

  // setup update event listener
  paymentModelEvents.on('update', async (context, model) => {
    if (model.state === PaymentState.Paid) {
      const invoice = await context.loaders.invoicesByID.load(model.invoiceID)
      if (!invoice) {
        console.warn(`No invoice with id ${model.invoiceID}`)
        return
      }
      await context.dbAdapter.invoice.updateInvoice({
        id: invoice.id,
        input: {
          ...invoice,
          paidAt: new Date(),
          canceledAt: null
        }
      })
    }
  })

  // setup webhook routes for each payment provider
  paymentProviders.forEach(paymentProvider => {
    paymentProviderWebhookRouter
      .route(`/${paymentProvider.id}`)
      .all(paymentProvider.incomingRequestHandler, async (req, res, next) => {
        await res.status(200).send() // respond immediately with 200 since webhook was received.
        logger('paymentProvider').info(
          'Received webhook from %s for paymentProvider %s',
          req.get('origin'),
          paymentProvider.id
        )
        try {
          const paymentStatuses = await paymentProvider.webhookForPaymentIntent({req})
          const context = await contextFromRequest(req, opts)

          for (const paymentStatus of paymentStatuses) {
            // TODO: handle errors properly
            await paymentProvider.updatePaymentWithIntentState({
              intentState: paymentStatus,
              dbAdapter: context.dbAdapter,
              loaders: context.loaders
            })
          }
        } catch (error) {
          logger('paymentProvider').error(
            error as Error,
            'Error during webhook update in paymentProvider %s',
            paymentProvider.id
          )
        }
      })
  })

  return paymentProviderWebhookRouter
}
