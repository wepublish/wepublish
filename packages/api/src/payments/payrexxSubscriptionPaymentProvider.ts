import {
  BasePaymentProvider,
  CheckIntentProps,
  CreatePaymentIntentProps,
  Intent,
  IntentState,
  PaymentProviderProps,
  UpdatePaymentWithIntentStateProps,
  WebhookForPaymentIntentProps
} from './paymentProvider'
import {logger} from '../server'
import {
  PaymentState,
  PaymentPeriodicity,
  Invoice,
  Subscription,
  SubscriptionDeactivationReason,
  Prisma,
  PrismaClient
} from '@prisma/client'
import fetch from 'node-fetch'
import * as crypto from 'crypto'
import {timingSafeEqual} from 'crypto'
import qs from 'qs'
import {Context} from '../context'
import {DateTime} from 'luxon'

export interface PayrexxSubscripionsPaymentProviderProps extends PaymentProviderProps {
  instanceName: string
  instanceAPISecret: string
  webhookSecret: string
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

function getMonths(pp: PaymentPeriodicity) {
  switch (pp) {
    case PaymentPeriodicity.yearly:
      return 12
    case PaymentPeriodicity.biannual:
      return 6
    case PaymentPeriodicity.quarterly:
      return 3
    case PaymentPeriodicity.monthly:
      return 1
    default:
      return 1
  }
}

function timeConstantCompare(a: string, b: string): boolean {
  try {
    return timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'))
  } catch {
    return false
  }
}

async function findSubscriptionByExternalId(
  subscriptionClient: PrismaClient['subscription'],
  externalId: string
) {
  return subscriptionClient.findFirst({
    where: {
      properties: {
        some: {
          key: 'payrexx_external_id',
          value: externalId
        }
      }
    },
    include: {
      properties: true,
      periods: true,
      deactivation: true,
      memberPlan: true
    }
  })
}

async function deletePeriodOfUnpaidInvoice(
  subscriptionPeriodClient: PrismaClient['subscriptionPeriod'],
  subscription: Subscription,
  invoice: Invoice
) {
  return subscriptionPeriodClient.deleteMany({
    where: {
      invoiceID: invoice.id
    }
  })
}

async function deleteUnpaidInvoices(
  invoiceClient: PrismaClient['invoice'],
  subscriptionPeriodClient: PrismaClient['subscriptionPeriod'],
  subscription: Subscription
) {
  const unpaidInvoices = await invoiceClient.findMany({
    where: {
      subscriptionID: subscription.id,
      paidAt: null
    }
  })
  for (const unpaidInvoice of unpaidInvoices) {
    await invoiceClient.delete({
      where: {
        id: unpaidInvoice.id
      }
    })
    await deletePeriodOfUnpaidInvoice(subscriptionPeriodClient, subscription, unpaidInvoice)
  }
}

export class PayrexxSubscriptionPaymentProvider extends BasePaymentProvider {
  readonly instanceName: string
  readonly instanceAPISecret: string
  readonly webhookSecret: string

  constructor(props: PayrexxSubscripionsPaymentProviderProps) {
    super(props)
    this.instanceName = props.instanceName
    this.instanceAPISecret = props.instanceAPISecret
    this.webhookSecret = props.webhookSecret
    this.activateHook()
  }

  activateHook() {
    return (context: Context): Prisma.Middleware => async (params, next) => {
      if (params.model !== 'Subscription' || params.action !== 'update') {
        return next(params)
      }

      const updatedSubscription: Subscription = params.args.data
      const prismaClient = context.prisma
      const subscriptionClient = prismaClient.subscription

      // Get subscription with joined stuff
      const subscription = await subscriptionClient.findUnique({
        where: {
          id: updatedSubscription.id
        },
        include: {
          properties: true,
          deactivation: true
        }
      })

      // Exit if subscription has no external id
      const isPayrexxExt = subscription?.properties.find(sub => sub.key === 'payrexx_external_id')
      if (!subscription || !isPayrexxExt || subscription.paymentMethodID !== this.id)
        return next(params)

      // Disable Subscription
      if (subscription.deactivation || !subscription.autoRenew) {
        await this.cancelRemoteSubscription(parseInt(isPayrexxExt.value, 10))

        const propertiesClient = prismaClient.subscriptionDeactivation

        await subscriptionClient.update({
          where: {
            id: subscription.id
          },
          data: {
            autoRenew: false,
            properties: {
              updateMany: {
                where: {
                  key: 'payrexx_external_id'
                },
                data: {
                  key: 'deactivated_payrexx_external_id'
                }
              }
            }
          },
          include: {
            properties: true,
            deactivation: true
          }
        })

        await propertiesClient.create({
          data: {
            subscriptionID: subscription.id,
            reason: SubscriptionDeactivationReason.userSelfDeactivated,
            date: new Date()
          }
        })

        // Update subscription
      } else {
        const amount = subscription.monthlyAmount * getMonths(subscription.paymentPeriodicity)
        await this.updateRemoteSubscription(parseInt(isPayrexxExt.value, 10), amount.toString())
      }
    }
  }

  async updatePaymentWithIntentState({
    intentState,
    paymentClient,
    paymentsByID,
    invoicesByID,
    subscriptionClient,
    userClient,
    invoiceClient,
    subscriptionPeriodClient,
    invoiceItemClient
  }: UpdatePaymentWithIntentStateProps): Promise<any> {
    const apiData = JSON.parse(intentState.paymentData ? intentState.paymentData : '{}')
    const rawSubscription = apiData.subscription
    const subscriptionId = rawSubscription.id

    if (intentState.state === PaymentState.paid) {
      const subscriptionValidUntil = DateTime.fromISO(rawSubscription.valid_until).startOf('day')

      // Get subscription
      const subscription = await findSubscriptionByExternalId(subscriptionClient, subscriptionId)
      if (!subscription) {
        logger('payrexxSubscriptionPaymentProvider').warn(
          `Subscription ${subscriptionId} received from payrexx webhook not found!`
        )
        return
      }

      // Calculate max possible Extension length for subscription
      const maxSubscriptionExtensionLength = subscriptionValidUntil.plus({
        month: getMonths(subscription.paymentPeriodicity)
      })

      // Find last period in array
      let longestPeriod
      for (const period of subscription.periods) {
        if (!longestPeriod || period.endsAt > longestPeriod.endsAt) {
          longestPeriod = period
        }
      }

      // If no period is found throw error
      if (!longestPeriod) throw Error(`No period found in subscription ${subscriptionId}`)

      // Skip if subscription is already renewed
      if (
        maxSubscriptionExtensionLength < DateTime.fromJSDate(longestPeriod.endsAt).startOf('day')
      ) {
        logger('payrexxSubscriptionPaymentProvider').warn(
          `Received webhook for subscription ${subscriptionId} which is already renewed: ${maxSubscriptionExtensionLength.toISO()} < ${DateTime.fromJSDate(
            longestPeriod.endsAt
          )
            .startOf('day')
            .toISO()}`
        )
        return
      }

      // Calculate new subscription valid until
      const newSubscriptionValidUntil = DateTime.fromJSDate(longestPeriod.endsAt)
        .plus({month: getMonths(subscription.paymentPeriodicity)})
        .toISO()

      console.log('NEW Subsription date: ' + newSubscriptionValidUntil)

      // Get User
      const user = await userClient.findUnique({
        where: {
          id: subscription.userID
        }
      })
      if (!user) throw Error('User in subscription not found!')

      // Get member plan
      const memberPlan = subscription.memberPlan
      if (!memberPlan) throw Error('Member Plan in subscription not found!')

      const payedAmount = rawSubscription.invoice.amount
      const minPayment =
        subscription.monthlyAmount * getMonths(subscription.paymentPeriodicity) - 100 // -1CHF to ensure that imported rounding differences are no issue
      if (payedAmount < minPayment) {
        logger('payrexxSubscriptionPaymentProvider').warn(
          `Payrexx Subscription ${subscription.id} payment ${payedAmount} lower than min payment ${minPayment}`
        )
        return
      }

      // Delete unpaid
      await deleteUnpaidInvoices(invoiceClient, subscriptionPeriodClient, subscription)

      // Create invoice

      const invoice = await invoiceClient.create({
        data: {
          mail: user.email,
          dueAt: new Date(),
          subscriptionID: subscription.id,
          description: `Abo ${memberPlan.name}`,
          paidAt: new Date(),
          canceledAt: null,
          sentReminderAt: new Date()
        }
      })

      await invoiceItemClient.create({
        data: {
          invoiceId: invoice.id,
          createdAt: new Date(),
          modifiedAt: new Date(),
          name: `Abo ${memberPlan.name}`,
          quantity: 1,
          amount: payedAmount
        }
      })
      if (!invoice) throw Error('Cant create Invoice')

      // Add subscription Period

      const subscriptionPeriod = await subscriptionPeriodClient.create({
        data: {
          startsAt: new Date(),
          endsAt: newSubscriptionValidUntil,
          paymentPeriodicity: subscription.paymentPeriodicity,
          amount: payedAmount,
          invoiceID: invoice.id
        }
      })
      if (!subscriptionPeriod) throw Error('Cant create subscription period')

      // Create Payment
      const payment = await paymentClient.create({
        data: {
          paymentMethodID: subscription.paymentMethodID,
          state: PaymentState.paid,
          invoiceID: invoice.id
        }
      })
      if (!payment) throw Error('Cant create Payment')

      // Update subscription
      await subscriptionClient.update({
        where: {
          id: subscription.id
        },
        data: {
          paidUntil: newSubscriptionValidUntil
        }
      })
      logger('payrexxSubscriptionPaymentProvider').info(
        `Subscription ${subscription.id} for user ${user.email} successfully renewed.`
      )
    } else {
      logger('payrexxSubscriptionPaymentProvider').info('External Auto renewal failed!')
    }
  }

  async updateRemoteSubscription(subscriptionId: number, amount: string) {
    const data = {
      amount,
      currency: 'CHF'
    }
    const signature = crypto
      .createHmac('sha256', this.instanceAPISecret)
      .update(qs.stringify(data))
      .digest('base64')

    const res = await fetch(
      `https://api.payrexx.com/v1.0/Subscription/${subscriptionId}/?instance=${encodeURIComponent(
        this.instanceName
      )}`,
      {
        method: 'PUT',
        body: qs.stringify({...data, ApiSignature: signature})
      }
    )
    if (res.status === 200) {
      logger('payrexxSubscriptionPaymentProvider').info(
        'Payrexx response for subscription %s updated',
        subscriptionId
      )
    } else {
      logger('payrexxSubscriptionPaymentProvider').error(
        'Payrexx subscription update response for subscription %s is NOK with status %s',
        subscriptionId,
        res.status
      )
      throw new Error(`Payrexx response is NOK with status ${res.status}`)
    }
  }

  async cancelRemoteSubscription(subscriptionId: number) {
    const signature = crypto.createHmac('sha256', this.instanceAPISecret).digest('base64')

    const res = await fetch(
      `https://api.payrexx.com/v1.0/Subscription/${subscriptionId}/?instance=${this.instanceName}`,
      {
        method: 'DELETE',
        body: qs.stringify({ApiSignature: signature})
      }
    )

    if (res.status === 200) {
      logger('payrexxSubscriptionPaymentProvider').info(
        'Payrexx response for subscription %s canceled',
        subscriptionId
      )
    } else {
      logger('payrexxSubscriptionPaymentProvider').error(
        'Payrexx subscription cancel response for subscription %s is NOK with status %s',
        subscriptionId,
        res.status
      )
      throw new Error(`Payrexx response is NOK with status ${res.status}`)
    }
  }

  async webhookForPaymentIntent(props: WebhookForPaymentIntentProps): Promise<IntentState[]> {
    const intentStates: IntentState[] = []

    // Protect endpoint
    const apiKey = props.req.query.apiKey as string
    if (!timeConstantCompare(apiKey, this.webhookSecret)) throw new Error('Invalid api key!')

    const transaction = props.req.body.transaction
    if (!transaction) throw new Error('Can not handle webhook')

    const state = mapPayrexxEventToPaymentStatus(transaction.status)
    if (state !== null && transaction.subscription) {
      intentStates.push({
        paymentID: transaction.referenceId,
        paymentData: JSON.stringify(transaction),
        state
      })
    }
    return intentStates
  }

  async createIntent(props: CreatePaymentIntentProps): Promise<Intent> {
    throw new Error('NOT IMPLEMENTED')
  }

  async checkIntentStatus({intentID}: CheckIntentProps): Promise<IntentState> {
    throw new Error('NOT IMPLEMENTED')
  }
}
