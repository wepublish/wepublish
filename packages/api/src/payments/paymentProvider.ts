import express, {Router} from 'express'
import {contextFromRequest} from '../context'
import {WepublishServerOpts} from '../server'
import {Payment, PaymentState} from '../db/payment'
import {Invoice} from '../db/invoice'
import {NextHandleFunction} from 'connect'
import bodyParser from 'body-parser'
import {paymentModelEvents} from '../events'

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
}

export interface PaymentProvider {
  id: string
  name: string
  offSessionPayments: boolean

  incomingRequestHandler: NextHandleFunction

  webhookForPaymentIntent(props: WebhookForPaymentIntentProps): Promise<IntentState[]>

  createIntent(props: CreatePaymentIntentProps): Promise<Intent>

  checkIntentStatus(props: CheckIntentProps): Promise<IntentState>
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
}

export function setupPaymentProvider(opts: WepublishServerOpts): Router {
  const {paymentProviders} = opts
  const paymentProviderWebhookRouter = Router()

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
          paidAt: new Date()
        }
      })

      // TODO: cancel all open payments for this invoice
    }
  })

  paymentProviders.forEach(paymentProvider => {
    paymentProviderWebhookRouter
      .route(`/${paymentProvider.id}`)
      .all(paymentProvider.incomingRequestHandler, async (req, res, next) => {
        await res.status(200).send() // respond immediately with 200 since webhook was received.
        try {
          const paymentStatuses = await paymentProvider.webhookForPaymentIntent({req})
          const context = await contextFromRequest(req, opts)

          for (const paymentStatus of paymentStatuses) {
            const payment = await context.loaders.paymentsByID.load(paymentStatus.paymentID)
            if (!payment) continue // TODO: handle missing payment
            await context.dbAdapter.payment.updatePayment({
              id: payment.id,
              input: {
                state: paymentStatus.state,
                paymentData: paymentStatus.paymentData,
                intentData: payment.intentData,
                intentSecret: payment.intentSecret,
                intentID: payment.intentID,
                invoiceID: payment.invoiceID,
                paymentMethodID: payment.paymentMethodID
              }
            })

            if (paymentStatus.customerID && payment.invoiceID) {
              const invoice = await context.loaders.invoicesByID.load(payment.invoiceID)
              if (!invoice?.userID) return // no userID
              const user = await context.dbAdapter.user.getUserByID(invoice.userID)
              if (!user) return // no user
              const {paymentProviderCustomers} = user
              paymentProviderCustomers[paymentProvider.id] = {
                id: paymentStatus.customerID,
                createdAt: new Date()
              }
              await context.dbAdapter.user.updatePaymentProviderCustomers({
                userID: user.id,
                paymentProviderCustomers
              })
            }
          }
        } catch (exception) {
          console.warn('Exception during payment update from webhook', exception)
        }
      })
  })

  return paymentProviderWebhookRouter
}
