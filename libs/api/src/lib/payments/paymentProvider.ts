import {Payment, PaymentState, PrismaClient, Subscription} from '@prisma/client'
import bodyParser from 'body-parser'
import {NextHandleFunction} from 'connect'
import express, {Router} from 'express'
import {Context, contextFromRequest} from '../context'
import {InvoiceWithItems} from '../db/invoice'
import {logger, WepublishServerOpts} from '../server'

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
  invoice: InvoiceWithItems
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
  paymentClient: PrismaClient['payment']
  paymentsByID: Context['loaders']['paymentsByID']
  invoicesByID: Context['loaders']['invoicesByID']
  subscriptionClient: PrismaClient['subscription']
  userClient: PrismaClient['user']
  invoiceClient: PrismaClient['invoice']
  subscriptionPeriodClient: PrismaClient['subscriptionPeriod']
  invoiceItemClient: PrismaClient['invoiceItem']
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
    paymentClient,
    paymentsByID,
    invoicesByID,
    subscriptionClient,
    userClient
  }: UpdatePaymentWithIntentStateProps): Promise<Payment> {
    const payment = await paymentsByID.load(intentState.paymentID)
    // TODO: should we overwrite already paid/canceled payments
    if (!payment) throw new Error(`Payment with ID ${intentState.paymentID} not found`)

    const updatedPayment = await paymentClient.update({
      where: {id: payment.id},
      data: {
        state: intentState.state,
        paymentData: intentState.paymentData,
        intentData: payment.intentData,
        intentSecret: payment.intentSecret,
        intentID: payment.intentID,
        invoiceID: payment.invoiceID,
        paymentMethodID: payment.paymentMethodID
      }
    })

    if (!updatedPayment) {
      throw new Error('Error while updating Payment')
    }

    // get invoice and subscription joins out of the payment
    const invoice = await invoicesByID.load(payment.invoiceID)

    if (!invoice || !invoice.subscriptionID) {
      throw new Error(`Invoice with ID ${payment.invoiceID} does not exist`)
    }

    const subscription = await subscriptionClient.findUnique({
      where: {
        id: invoice.subscriptionID
      }
    })

    if (!subscription) {
      throw new Error(`Subscription with ID ${invoice.subscriptionID} does not exist`)
    }

    // update payment provider
    if (intentState.customerID && payment.invoiceID) {
      await this.updatePaymentProvider(userClient, subscription, intentState.customerID)
    }

    return updatedPayment
  }

  /**
   * adding or updating paymentProvider customer ID for user
   *
   * @param userClient
   * @param subscription
   * @param customerID
   * @private
   */
  private async updatePaymentProvider(
    userClient: PrismaClient['user'],
    subscription: Subscription,
    customerID: string
  ) {
    if (!subscription) {
      throw new Error('Empty subscription within updatePaymentProvider method.')
    }

    const user = await userClient.findUnique({
      where: {
        id: subscription.userID
      },
      include: {
        paymentProviderCustomers: true
      }
    })

    if (!user) throw new Error(`User with ID ${subscription.userID} does not exist`)

    await userClient.update({
      where: {
        id: user.id
      },
      data: {
        paymentProviderCustomers: {
          deleteMany: {
            paymentProviderID: this.id
          },
          create: {
            paymentProviderID: this.id,
            customerID
          }
        }
      }
    })
  }
}

export function setupPaymentProvider(opts: WepublishServerOpts): Router {
  const {paymentProviders, prisma} = opts
  const paymentProviderWebhookRouter = Router()

  prisma.$use(async (params, next) => {
    if (params.model !== 'Payment') {
      return next(params)
    }

    if (params.action !== 'update') {
      return next(params)
    }

    const model: Payment = await next(params)

    if (model.state === PaymentState.paid) {
      const invoice = await prisma.invoice.findUnique({
        where: {id: model.invoiceID},
        include: {
          items: true
        }
      })

      if (!invoice) {
        console.warn(`No invoice with id ${model.invoiceID}`)
        return
      }

      const {items, ...invoiceData} = invoice

      await prisma.invoice.update({
        where: {id: invoice.id},
        data: {
          ...invoiceData,
          items: {
            deleteMany: {
              invoiceId: invoiceData.id
            },
            create: items.map(({invoiceId, ...item}) => item)
          },
          paidAt: new Date(),
          canceledAt: null
        }
      })
    }

    return model
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
              paymentClient: context.prisma.payment,
              paymentsByID: context.loaders.paymentsByID,
              invoicesByID: context.loaders.invoicesByID,
              subscriptionClient: context.prisma.subscription,
              userClient: context.prisma.user,
              invoiceClient: context.prisma.invoice,
              subscriptionPeriodClient: context.prisma.subscriptionPeriod,
              invoiceItemClient: context.prisma.invoiceItem
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
