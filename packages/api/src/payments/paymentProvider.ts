import {Invoice} from '../db/invoice'
import {Router} from 'express'
import {contextFromRequest} from '../context'
import {WepublishServerOpts} from '../server'
import {DBAdapter} from '../db/adapter'
import {Payment} from '../db/payment'
import bodyParser from 'body-parser'

export const WEBHOOK_PATH_PREFIX = 'payment-webhooks'

export interface IntentStatus {
  successful: boolean
  open: boolean
  paymentData?: string
  paymentUserID?: string
}

export interface CreateIntentProps {
  invoice: Invoice
  user?: string
  successURL?: string
  failureURL?: string
}

export interface CheckIntentProps {
  payment: Payment
  data: string
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

export interface IntentArgs {
  intentID: string
  amount: number
  intentData?: string
  open: boolean
  successful: boolean
  paymentData?: string
}

export interface PaymentProvider {
  id: string
  name: string
  offSessionPayments: boolean

  hostURL: string

  getWebhookURL(): string

  getInvoiceIDFromWebhook(props: GetInvoiceIDFromWebhookProps): string

  webhookUpdate(props: WebhookUpdatesProps): Promise<IntentStatus>

  createIntent(props: CreateIntentProps): Promise<IntentArgs>

  checkIntentStatus(props: CheckIntentProps): Promise<IntentStatus>
}

export interface PaymentProviderProps {
  id: string
  name: string
  hostURL: string
  offSessionPayments: boolean
}

export abstract class BasePaymentProvider implements PaymentProvider {
  readonly id: string
  readonly name: string
  readonly offSessionPayments: boolean

  readonly hostURL: string

  protected constructor(props: PaymentProviderProps) {
    this.id = props.id
    this.name = props.name
    this.hostURL = props.hostURL
    this.offSessionPayments = props.offSessionPayments
  }

  getWebhookURL(): string {
    return `${this.hostURL}/${WEBHOOK_PATH_PREFIX}/${this.id}`
  }

  abstract getInvoiceIDFromWebhook(props: GetInvoiceIDFromWebhookProps): string

  abstract webhookUpdate(props: WebhookUpdatesProps): Promise<IntentStatus>

  abstract createIntent(props: CreateIntentProps): Promise<IntentArgs>

  abstract checkIntentStatus(props: CheckIntentProps): Promise<IntentStatus>
}

export async function updatePayment(
  payment: Payment,
  paymentStatus: IntentStatus,
  dbAdapter: DBAdapter
): Promise<Payment> {
  const {successful, open, paymentData} = paymentStatus
  const updatedPayment = await dbAdapter.payment.updatePayment({
    id: payment.id,
    input: {
      intentID: payment.intentID,
      amount: payment.amount,
      invoiceID: payment.invoiceID,
      intentData: payment.intentData,
      open: open,
      successful: successful,
      paymentMethodID: payment.paymentMethodID,
      paymentData: paymentData || payment.paymentData
    }
  })

  if (!updatedPayment) {
    throw new Error('Error updating payment')
  }

  if (
    updatedPayment &&
    !updatedPayment.open &&
    updatedPayment?.successful &&
    updatedPayment.invoiceID
  ) {
    // TODO: mark invoice as payed
  }

  return updatedPayment
}

export function setupPaymentProvider(opts: WepublishServerOpts): Router {
  const {paymentProviders} = opts
  const paymentProviderWebhookRouter = Router()

  paymentProviders.forEach(paymentProvider => {
    paymentProviderWebhookRouter
      .route(`/${paymentProvider.id}`)
      .all(bodyParser.raw({type: 'application/json'}), async (req, res, next) => {
        res.status(200).send() // respond immediately with 200 since webhook was received.
        try {
          const {body} = req
          const invoiceID = paymentProvider.getInvoiceIDFromWebhook({body, headers: req.headers})

          const context = await contextFromRequest(req, opts)
          const payments = await context.dbAdapter.payment.getPaymentsByInvoiceID(invoiceID)
          const payment = payments.find(payment => payment?.open)
          if (!payment) {
            // TODO: implement error handling
            console.warn('No payment found')
            return
          }

          const paymentStatus = await paymentProvider.webhookUpdate({
            payment,
            body,
            headers: req.headers
          })
          await updatePayment(payment, paymentStatus, context.dbAdapter)
        } catch (exception) {
          console.warn('Exception during payment update from webhook', exception)
        }
      })
  })

  return paymentProviderWebhookRouter
}
