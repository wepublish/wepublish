import {
  Currency,
  Invoice,
  InvoiceItem,
  MetadataProperty,
  Payment,
  PaymentState,
  PrismaClient,
  Subscription
} from '@prisma/client'
import bodyParser from 'body-parser'
import {NextHandleFunction} from 'connect'
import express from 'express'
import DataLoader from 'dataloader'

export type InvoiceWithItems = Invoice & {
  items: InvoiceItem[]
}

export type InvoicesByID = DataLoader<string, InvoiceWithItems | null>
export type PaymentsByID = DataLoader<string, Payment | null>

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
  currency: Currency
  saveCustomer: boolean
  customerID?: string
  successURL?: string
  failureURL?: string
  backgroundTask?: boolean
}

export interface CheckIntentProps {
  intentID: string
  paymentID: string
}

export interface UpdateRemoteSubscriptionAmountProps {
  newAmount: number
  subscription: Subscription & {properties: MetadataProperty[]}
}

export interface CancelRemoteSubscriptionProps {
  subscription: Subscription & {properties: MetadataProperty[]}
}

export interface CreateRemoteInvoiceProps {
  subscription: Subscription & {properties: MetadataProperty[]}
  invoice: Invoice & {items: InvoiceItem[]}
}

export interface UpdatePaymentWithIntentStateProps {
  intentState: IntentState
  paymentClient: PrismaClient['payment']
  paymentsByID: PaymentsByID
  invoicesByID: InvoicesByID
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

export type WebhookResponse = {
  status: number
  message?: string
  paymentStates?: IntentState[]
}

export interface PaymentProvider {
  id: string
  name: string
  offSessionPayments: boolean
  remoteManagedSubscription: boolean

  incomingRequestHandler: NextHandleFunction

  webhookForPaymentIntent(props: WebhookForPaymentIntentProps): Promise<WebhookResponse>

  createIntent(props: CreatePaymentIntentProps): Promise<Intent>

  checkIntentStatus(props: CheckIntentProps): Promise<IntentState>

  updatePaymentWithIntentState(props: UpdatePaymentWithIntentStateProps): Promise<Payment>

  updateRemoteSubscriptionAmount(props: UpdateRemoteSubscriptionAmountProps): Promise<void>

  cancelRemoteSubscription(props: CancelRemoteSubscriptionProps): Promise<void>

  createRemoteInvoice(props: CreateRemoteInvoiceProps): Promise<void>
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
  readonly remoteManagedSubscription: boolean = false

  readonly incomingRequestHandler: NextHandleFunction

  protected constructor(props: PaymentProviderProps) {
    this.id = props.id
    this.name = props.name
    this.offSessionPayments = props.offSessionPayments
    this.incomingRequestHandler = props.incomingRequestHandler ?? bodyParser.json()
  }

  abstract webhookForPaymentIntent(props: WebhookForPaymentIntentProps): Promise<WebhookResponse>

  abstract createIntent(props: CreatePaymentIntentProps): Promise<Intent>

  abstract checkIntentStatus(props: CheckIntentProps): Promise<IntentState>

  async updateRemoteSubscriptionAmount(props: UpdateRemoteSubscriptionAmountProps): Promise<void> {
    return
  }

  async cancelRemoteSubscription(props: CancelRemoteSubscriptionProps): Promise<void> {
    return
  }

  async createRemoteInvoice(props: CreateRemoteInvoiceProps): Promise<void> {
    return
  }

  async updatePaymentWithIntentState({
    intentState,
    paymentClient,
    paymentsByID,
    invoicesByID,
    subscriptionClient,
    userClient,
    invoiceClient
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
      },
      include: {
        periods: true
      }
    })

    if (!subscription) {
      throw new Error(`Subscription with ID ${invoice.subscriptionID} does not exist`)
    }

    const invoicePeriod = subscription.periods.find(period => period.invoiceID === invoice.id)

    if (!invoicePeriod) {
      throw new Error(`Invoice with ID ${invoice.id} has no period!`)
    }

    // Mark invoice as paid
    if (intentState.state === PaymentState.paid) {
      await invoiceClient.update({
        where: {id: invoice.id},
        data: {
          paidAt: new Date()
        }
      })

      await subscriptionClient.update({
        where: {id: invoice.subscriptionID},
        data: {
          paidUntil: invoicePeriod.endsAt
        }
      })
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
