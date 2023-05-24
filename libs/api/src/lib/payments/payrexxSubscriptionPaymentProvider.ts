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
  PrismaClient,
  MetadataProperty
} from '@prisma/client'
import fetch from 'node-fetch'
import * as crypto from 'crypto'
import {timingSafeEqual} from 'crypto'
import qs from 'qs'
import sub from 'date-fns/sub'
import parseISO from 'date-fns/parseISO'
import startOfDay from 'date-fns/startOfDay'
import add from 'date-fns/add'

export interface PayrexxSubscripionsPaymentProviderProps extends PaymentProviderProps {
  instanceName: string
  instanceAPISecret: string
  webhookSecret: string
  prisma: PrismaClient
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
          value: `${externalId}`
        }
      }
    },
    include: {
      properties: true,
      deactivation: true,
      memberPlan: true,
      periods: {
        include: {
          invoice: true
        }
      }
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
      paidAt: null,
      canceledAt: null
    }
  })
  for (const unpaidInvoice of unpaidInvoices) {
    await deletePeriodOfUnpaidInvoice(subscriptionPeriodClient, subscription, unpaidInvoice)
    await invoiceClient.delete({
      where: {
        id: unpaidInvoice.id
      }
    })
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
    this.activateHook(props.prisma)
  }

  activateHook(prisma: PrismaClient) {
    console.log('Activate Payrexx subscription prisma hook')

    const hook = (): Prisma.Middleware => async (params, next) => {
      // Only handle subscription update db queries skip all other
      if (params.model !== 'Subscription' || params.action !== 'update') {
        return next(params)
      }
      const subscription = params.args.data
      const subscriptionID = params.args.where.id

      const subscriptionObject = await prisma.subscription.findUnique({
        where: {
          id: subscriptionID
        },
        include: {
          properties: true
        }
      })

      if (!subscriptionObject) {
        throw Error('Payrexx subscription: Subscription not found!')
      }

      // Get paymentProviderName
      const paymentProvider = await prisma.paymentMethod.findUnique({
        where: {
          id: subscriptionObject.paymentMethodID
        }
      })

      // Exit if subscription has no external id or is other payment provider
      if (paymentProvider?.paymentProviderID !== this.id) {
        return next(params)
      }

      // Find external id property and fail if subscription has been deactivated
      const properties: MetadataProperty[] = subscriptionObject.properties
      const isPayrexxExt = properties.find(sub => sub.key === 'payrexx_external_id')
      if (!isPayrexxExt) {
        throw Error("It's not supported to reactivate a deactivated Payrexx subscription!")
      }

      const deactivation = params.args.data.deactivation
      // Disable Subscription (deactivation.upsert is defined if a deactivation is added)
      if (deactivation?.upsert || ('autoRenew' in subscription && !subscription.autoRenew)) {
        await this.cancelRemoteSubscription(parseInt(isPayrexxExt.value, 10))

        // Rewrite properties
        isPayrexxExt.key = 'deactivated_payrexx_external_id'

        // Rewrite subscription
        subscription.autoRenew = false
        subscription.deactivation = {
          upsert: {
            create: {
              date: new Date(),
              reason: SubscriptionDeactivationReason.userSelfDeactivated
            },
            update: {
              date: new Date(),
              reason: SubscriptionDeactivationReason.userSelfDeactivated
            }
          }
        }
        subscription.properties = {
          update: {
            where: {
              id: isPayrexxExt.id
            },
            data: {
              key: isPayrexxExt.key
            }
          }
        }

        // Update subscription
      } else if (params?.args?.data?.monthlyAmount) {
        const amount = subscription.monthlyAmount * getMonths(subscription.paymentPeriodicity)
        await this.updateRemoteSubscription(parseInt(isPayrexxExt.value, 10), amount.toString())
      }

      // Return in the end
      return next(params)
    }
    prisma.$use(hook())
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
      const subscriptionValidUntil = startOfDay(parseISO(rawSubscription.valid_until))

      // Get subscription
      const subscription = await findSubscriptionByExternalId(subscriptionClient, subscriptionId)
      if (!subscription) {
        logger('payrexxSubscriptionPaymentProvider').warn(
          `Subscription ${subscriptionId} received from payrexx webhook not found!`
        )
        return
      }

      // Calculate max possible Extension length for subscription security margin of 7 days
      const maxSubscriptionExtensionLength = sub(subscriptionValidUntil, {days: 7})

      // Find last paid period in array
      let longestPeriod
      for (const period of subscription.periods) {
        if (period.invoice.paidAt && (!longestPeriod || period.endsAt > longestPeriod.endsAt)) {
          longestPeriod = period
        }
      }

      // If no period is found throw error
      if (!longestPeriod) throw Error(`No period found in subscription ${subscriptionId}`)

      // Skip if subscription is already renewed
      if (maxSubscriptionExtensionLength <= startOfDay(longestPeriod.endsAt)) {
        logger('payrexxSubscriptionPaymentProvider').warn(
          `Received webhook for subscription ${subscriptionId} which is already renewed: ${maxSubscriptionExtensionLength.toISOString()} <= ${startOfDay(
            longestPeriod.endsAt
          ).toISOString()}`
        )
        return
      }

      // Calculate new subscription valid until
      const newSubscriptionValidUntil = add(longestPeriod.endsAt, {
        months: getMonths(subscription.paymentPeriodicity)
      }).toISOString()
      const newSubscriptionValidFrom = add(longestPeriod.endsAt, {
        days: 1
      }).toISOString()

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
          subscriptionId: subscription.id,
          startsAt: newSubscriptionValidFrom,
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
