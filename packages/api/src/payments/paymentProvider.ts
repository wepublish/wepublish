import {Invoice} from '../db/invoice'
import {Router} from 'express'
import {contextFromRequest} from '../context'
import {WepublishServerOpts} from '../server'
import {DBAdapter} from '../db/adapter'
import {Payment} from '../db/payment'

export const WEBHOOK_PATH_PREFIX = 'pp-wh'

export interface PaymentStatus {
  payment: Payment
  successful: boolean
  open: boolean
  paymentData?: object
}

export interface CreatePaymentProps {
  invoice: Invoice
  successURL?: string
  failureURL?: string
}

export interface CheckPaymentProps {
  payment: Payment
  data: any
}

export interface PaymentArgs {
  intentID: string
  amount: number
  intentData?: object
  open: boolean
  successful: boolean
  paymentData?: object
}

export interface PaymentProvider {
  id: string
  name: string

  hostURL: string

  getWebhookURL(): string

  getPaymentIDFromWebhook(data: any): string

  webhookUpdate(props: CheckPaymentProps): Promise<PaymentStatus>

  createPayment(props: CreatePaymentProps): Promise<PaymentArgs>

  checkPaymentStatus(props: CheckPaymentProps): Promise<PaymentStatus>
}

export interface PaymentProviderProps {
  id: string
  name: string
  hostURL: string
}

export abstract class BasePaymentProvider implements PaymentProvider {
  readonly id: string
  readonly name: string

  readonly hostURL: string

  protected constructor(props: PaymentProviderProps) {
    this.id = props.id
    this.name = props.name
    this.hostURL = props.hostURL
  }

  getWebhookURL(): string {
    return `${this.hostURL}/${WEBHOOK_PATH_PREFIX}/${this.id}`
  }

  abstract getPaymentIDFromWebhook(data: any): string

  abstract webhookUpdate(props: CheckPaymentProps): Promise<PaymentStatus>

  abstract createPayment(props: CreatePaymentProps): Promise<PaymentArgs>

  abstract checkPaymentStatus(props: CheckPaymentProps): Promise<PaymentStatus>
}

export async function updatePayment(
  paymentStatus: PaymentStatus,
  dbAdapter: DBAdapter
): Promise<Payment> {
  const {payment, successful, open, paymentData} = paymentStatus
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
      paymentData: paymentData ? paymentData : payment.paymentData
    }
  })

  if (!updatedPayment) {
    throw new Error('Error updating pamyent')
  }

  if (
    updatedPayment &&
    !updatedPayment.open &&
    updatedPayment?.successful &&
    updatedPayment.invoiceID
  ) {
    //TODO: mark invoice as payed
  }

  return updatedPayment
}

export function setupPaymentProvider(opts: WepublishServerOpts): Router {
  const {paymentProviders} = opts
  const paymentProviderWebhookRouter = Router()

  paymentProviders.forEach(paymentProvider => {
    paymentProviderWebhookRouter.all(`${paymentProvider.id}`, async (req, res, next) => {
      console.log('super Test', req)
      const {body} = req
      const paymentID = paymentProvider.getPaymentIDFromWebhook(body)

      const context = await contextFromRequest(req, opts)
      const payment = await context.loaders.paymentsByID.load(paymentID)
      if (!payment) {
        // TODO: implement error handling
        console.warn('No Invoice found')
        return
      }

      const paymentStatus = await paymentProvider.webhookUpdate({payment, data: body})
      await updatePayment(paymentStatus, context.dbAdapter)
      res.status(200).send()
    })
  })

  return paymentProviderWebhookRouter
}
