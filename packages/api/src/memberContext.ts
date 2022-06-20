import {
  Invoice,
  MemberPlan,
  MetadataProperty,
  PaymentMethod,
  PaymentPeriodicity,
  PrismaClient,
  Subscription
} from '@prisma/client'
import {DataLoaderContext} from './context'
import {DBAdapter} from './db/adapter'
import {PaymentState} from './db/payment'
import {SubscriptionDeactivationReason} from './db/subscription'
import {PaymentProviderCustomer, User} from './db/user'
import {InternalError, NotFound, PaymentConfigurationNotAllowed, UserInputError} from './error'
import {MailContext, SendMailType} from './mails/mailContext'
import {PaymentProvider} from './payments/paymentProvider'
import {logger} from './server'
import {
  ONE_DAY_IN_MILLISECONDS,
  ONE_HOUR_IN_MILLISECONDS,
  ONE_MONTH_IN_MILLISECONDS
} from './utility'

export interface HandleSubscriptionChangeProps {
  subscription: Subscription
}

export interface RenewSubscriptionForUserProps {
  subscription: Subscription
}

export interface RenewSubscriptionForUsersProps {
  startDate?: Date // defaults to today
  daysToLookAhead: number
}

export interface ChargeInvoiceProps {
  user: User
  invoice: Invoice
  paymentMethodID: string
  customer: PaymentProviderCustomer
}

export interface SendReminderForInvoiceProps {
  invoice: Invoice
  replyToAddress: string
}

export interface SendReminderForInvoicesProps {
  replyToAddress: string
}

export interface CheckOpenInvoiceProps {
  invoice: Invoice
}

export interface DeactivateSubscriptionForUserProps {
  subscriptionID: string
  deactivationDate?: Date
  deactivationReason?: SubscriptionDeactivationReason
}

export interface MemberContext {
  dbAdapter: DBAdapter
  prisma: PrismaClient
  loaders: DataLoaderContext
  paymentProviders: PaymentProvider[]

  mailContext: MailContext
  getLoginUrlForUser(user: User): string

  handleSubscriptionChange(props: HandleSubscriptionChangeProps): Promise<Subscription>

  renewSubscriptionForUser(props: RenewSubscriptionForUserProps): Promise<Invoice | null>
  renewSubscriptionForUsers(props: RenewSubscriptionForUsersProps): Promise<void>

  checkOpenInvoices(): Promise<void>
  checkOpenInvoice(props: CheckOpenInvoiceProps): Promise<void>

  chargeInvoice(props: ChargeInvoiceProps): Promise<void>
  chargeOpenInvoices(): Promise<void>

  sendReminderForInvoice(props: SendReminderForInvoiceProps): Promise<void>
  sendReminderForInvoices(props: SendReminderForInvoicesProps): Promise<void>

  deactivateSubscriptionForUser(props: DeactivateSubscriptionForUserProps): Promise<void>
}

export interface MemberContextProps {
  readonly dbAdapter: DBAdapter
  readonly prisma: PrismaClient
  readonly loaders: DataLoaderContext
  readonly paymentProviders: PaymentProvider[]
  readonly mailContext: MailContext
  getLoginUrlForUser(user: User): string
}

export function getNextDateForPeriodicity(start: Date, periodicity: PaymentPeriodicity): Date {
  start = new Date(start.getTime() - ONE_DAY_IN_MILLISECONDS) // create new Date object
  switch (periodicity) {
    case PaymentPeriodicity.monthly:
      return new Date(start.setMonth(start.getMonth() + 1))
    case PaymentPeriodicity.quarterly:
      return new Date(start.setMonth(start.getMonth() + 3))
    case PaymentPeriodicity.biannual:
      return new Date(start.setMonth(start.getMonth() + 6))
    case PaymentPeriodicity.yearly:
      return new Date(start.setMonth(start.getMonth() + 12))
  }
}

export function calculateAmountForPeriodicity(
  monthlyAmount: number,
  periodicity: PaymentPeriodicity
): number {
  switch (periodicity) {
    case PaymentPeriodicity.monthly:
      return monthlyAmount
    case PaymentPeriodicity.quarterly:
      return monthlyAmount * 3
    case PaymentPeriodicity.biannual:
      return monthlyAmount * 6
    case PaymentPeriodicity.yearly:
      return monthlyAmount * 12
  }
}

interface GetNextReminderAndDeactivationDateProps {
  sentReminderAt: Date
  createdAt: Date
}

interface ReminderAndDeactivationDate {
  nextReminder: Date
  deactivateSubscription: Date
}

function getNextReminderAndDeactivationDate({
  sentReminderAt,
  createdAt
}: GetNextReminderAndDeactivationDateProps): ReminderAndDeactivationDate {
  const invoiceReminderFrequencyInDays = parseInt(process.env.INVOICE_REMINDER_FREQ ?? '') || 3
  const invoiceReminderMaxTries = parseInt(process.env.INVOICE_REMINDER_MAX_TRIES ?? '') || 5

  const nextReminder = new Date(
    sentReminderAt.getTime() +
      invoiceReminderFrequencyInDays * ONE_DAY_IN_MILLISECONDS -
      ONE_HOUR_IN_MILLISECONDS
  )

  const deactivateSubscription = new Date(
    createdAt.getTime() +
      invoiceReminderFrequencyInDays * invoiceReminderMaxTries * ONE_DAY_IN_MILLISECONDS -
      ONE_HOUR_IN_MILLISECONDS
  )

  return {
    nextReminder,
    deactivateSubscription
  }
}

export class MemberContext implements MemberContext {
  dbAdapter: DBAdapter
  loaders: DataLoaderContext
  paymentProviders: PaymentProvider[]

  mailContext: MailContext
  getLoginUrlForUser: (user: User) => string

  constructor(props: MemberContextProps) {
    this.dbAdapter = props.dbAdapter
    this.loaders = props.loaders
    this.paymentProviders = props.paymentProviders

    this.mailContext = props.mailContext

    this.getLoginUrlForUser = props.getLoginUrlForUser
  }

  async handleSubscriptionChange({
    subscription
  }: HandleSubscriptionChangeProps): Promise<Subscription> {
    // Check if user has any unpaid Periods and delete them and their invoices if so
    const invoices = await this.prisma.invoice.findMany({
      where: {
        subscriptionID: subscription.id
      }
    })

    const openInvoice = invoices.find(
      invoice => invoice?.paidAt === null && invoice?.canceledAt === null
    )

    if (openInvoice || subscription.paidUntil === null || subscription.paidUntil <= new Date()) {
      const periodToDelete = subscription.periods.find(
        period => period.invoiceID === openInvoice?.id
      )

      if (periodToDelete) {
        await this.dbAdapter.subscription.deleteSubscriptionPeriod({
          subscriptionID: subscription.id,
          periodID: periodToDelete.id
        })
      }

      const finalUpdatedSubscription = await this.prisma.subscription.findUnique({
        where: {id: subscription.id}
      })
      if (!finalUpdatedSubscription) throw new Error('Error during updateSubscription')

      // renew user subscription
      await this.renewSubscriptionForUser({
        subscription: finalUpdatedSubscription
      })

      return finalUpdatedSubscription
    }
    return subscription
  }

  async renewSubscriptionForUser({
    subscription
  }: RenewSubscriptionForUserProps): Promise<Invoice | null> {
    try {
      const {periods = [], paidUntil, deactivation} = subscription

      if (deactivation) {
        logger('memberContext').info(
          'Subscription with id %s is deactivated and will not be renewed',
          subscription.id
        )
        return null
      }

      periods.sort((periodA, periodB) => {
        if (periodA.endsAt < periodB.endsAt) return -1
        if (periodA.endsAt > periodB.endsAt) return 1
        return 0
      })
      if (
        periods.length > 0 &&
        ((paidUntil === null && periods.length > 0) ||
          (paidUntil !== null && periods[periods.length - 1].endsAt > paidUntil))
      ) {
        const period = periods[periods.length - 1]
        const invoice = await this.prisma.invoice.findUnique({
          where: {
            id: period.invoiceID
          }
        })
        // only return the invoice if it hasn't been canceled. Otherwise
        // create a new period and a new invoice
        if (!invoice?.canceledAt) {
          return invoice
        }
      }

      const startDate = new Date(
        paidUntil && paidUntil.getTime() > new Date().getTime() - ONE_MONTH_IN_MILLISECONDS
          ? paidUntil.getTime() + ONE_DAY_IN_MILLISECONDS
          : new Date().getTime()
      )
      const nextDate = getNextDateForPeriodicity(
        startDate,
        subscription.paymentPeriodicity as PaymentPeriodicity
      )
      const amount = calculateAmountForPeriodicity(
        subscription.monthlyAmount,
        subscription.paymentPeriodicity as PaymentPeriodicity
      )

      const user = await this.prisma.user.findUnique({
        where: {
          id: subscription.userID
        }
      })

      if (!user) {
        logger('memberContext').info('User with id "%s" not found', subscription.userID)
        return null
      }

      const newInvoice = await this.prisma.invoice.create({
        data: {
          subscriptionID: subscription.id,
          description: `Membership from ${startDate.toISOString()} for ${user.name || user.email}`,
          mail: user.email,
          dueAt: startDate,
          items: [
            {
              createdAt: new Date(),
              modifiedAt: new Date(),
              name: 'Membership',
              description: `From ${startDate.toISOString()} to ${nextDate.toISOString()}`,
              amount,
              quantity: 1
            }
          ],
          paidAt: null,
          canceledAt: null,
          modifiedAt: new Date()
        }
      })
      await this.dbAdapter.subscription.addSubscriptionPeriod({
        subscriptionID: subscription.id,
        input: {
          amount,
          paymentPeriodicity: subscription.paymentPeriodicity as PaymentPeriodicity,
          startsAt: startDate,
          endsAt: nextDate,
          invoiceID: newInvoice.id
        }
      })
      logger('memberContext').info('Renewed subscription with id %s', subscription.id)
      return newInvoice
    } catch (error) {
      logger('memberContext').error(
        error as Error,
        'Error while renewing subscription with id %s',
        subscription.id
      )
    }
    return null
  }

  async renewSubscriptionForUsers({
    startDate = new Date(),
    daysToLookAhead
  }: RenewSubscriptionForUsersProps): Promise<void> {
    if (daysToLookAhead < 1) {
      throw Error('Days to look ahead must not be lower than 1')
    }
    const lookAheadDate = new Date(startDate.getTime() + daysToLookAhead * ONE_DAY_IN_MILLISECONDS)

    const subscriptionsPaidUntil: Subscription[] = []
    let hasMore = true
    let cursor: string | null = null
    while (hasMore) {
      const subscriptions: Subscription[] = await this.prisma.subscription.findMany({
        where: {
          autoRenew: true,
          paidUntil: {
            lte: lookAheadDate
          },
          deactivation: null
        },
        orderBy: {
          createdAt: 'asc'
        },
        skip: cursor ? 1 : 0,
        take: 100,
        cursor: cursor
          ? {
              id: cursor
            }
          : undefined
      })

      hasMore = Boolean(subscriptions?.length)
      cursor = subscriptions?.length ? subscriptions[subscriptions.length - 1].id : null
      subscriptionsPaidUntil.push(...subscriptions)
    }

    const subscriptionPaidNull: Subscription[] = []
    hasMore = true
    cursor = null
    while (hasMore) {
      const subscriptions: Subscription[] = await this.prisma.subscription.findMany({
        where: {
          autoRenew: true,
          paidUntil: null,
          deactivation: null
        },
        orderBy: {
          createdAt: 'asc'
        },
        skip: cursor ? 1 : 0,
        take: 100,
        cursor: cursor
          ? {
              id: cursor
            }
          : undefined
      })

      hasMore = Boolean(subscriptions?.length)
      cursor = subscriptions?.length ? subscriptions[subscriptions.length - 1].id : null
      subscriptionPaidNull.push(...subscriptions)
    }

    for (const subscription of [...subscriptionsPaidUntil, ...subscriptionPaidNull]) {
      await this.renewSubscriptionForUser({subscription})
    }
  }

  async checkOpenInvoices(): Promise<void> {
    const openInvoices = await this.getAllOpenInvoices()
    for (const invoice of openInvoices) {
      const subscription = await this.prisma.subscription.findUnique({
        where: {
          id: invoice.subscriptionID
        }
      })
      if (!subscription) {
        logger('memberContext').warn('subscription "%s" not found', invoice.subscriptionID)
        continue
      }

      await this.checkOpenInvoice({invoice})
    }
  }

  async checkOpenInvoice({invoice}: CheckOpenInvoiceProps): Promise<void> {
    const paymentMethods = await this.prisma.paymentMethod.findMany()
    const payments = await this.prisma.payment.findMany({
      where: {
        invoiceID: invoice.id
      }
    })

    for (const payment of payments) {
      if (!payment?.intentID) {
        logger('memberContext').error('Payment %s does not have an intentID', payment?.id)
        continue
      }

      const paymentMethod = paymentMethods.find(method => method.id === payment.paymentMethodID)

      if (!paymentMethod) {
        logger('memberContext').error('PaymentMethod %s does not exist', payment.paymentMethodID)
        continue
      }

      const paymentProvider = this.paymentProviders.find(
        provider => provider.id === paymentMethod.paymentProviderID
      )

      if (!paymentProvider) {
        logger('memberContext').error(
          'PaymentProvider %s does not exist',
          paymentMethod.paymentProviderID
        )
        continue
      }

      try {
        const intentState = await paymentProvider.checkIntentStatus({
          intentID: payment.intentID
        })

        await paymentProvider.updatePaymentWithIntentState({
          intentState,
          dbAdapter: this.dbAdapter,
          paymentsByID: this.loaders.paymentsByID,
          invoicesByID: this.loaders.invoicesByID,
          subscriptionClient: this.prisma.subscription,
          userClient: this.prisma.user
        })

        // FIXME: We need to implement a way to wait for all the database
        //  event hooks to finish before we return data. Will be solved in WPC-498
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (error) {
        logger('memberContext').error(
          error as Error,
          'Checking Intent State for Payment %s failed',
          payment?.id
        )
      }
    }
  }

  private getOffSessionPaymentProviderIDs(): string[] {
    return this.paymentProviders
      .filter(provider => provider.offSessionPayments)
      .map(provider => provider.id)
  }

  private async getAllOpenInvoices(): Promise<Invoice[]> {
    const openInvoices: Invoice[] = []
    let hasMore = true
    let cursor: string | null = null
    while (hasMore) {
      const invoices: Invoice[] = await this.prisma.invoice.findMany({
        where: {
          paidAt: null,
          canceledAt: null
        },
        orderBy: {
          createdAt: 'asc'
        },
        skip: cursor ? 1 : 0,
        take: 100,
        cursor: cursor
          ? {
              id: cursor
            }
          : undefined
      })

      hasMore = Boolean(invoices?.length)
      cursor = invoices?.length ? invoices[invoices.length - 1].id : null
      openInvoices.push(...invoices)
    }

    return openInvoices
  }

  async chargeOpenInvoices(): Promise<void> {
    const today = new Date()
    const openInvoices = await this.getAllOpenInvoices()
    const offSessionPaymentProvidersID = this.getOffSessionPaymentProviderIDs()

    for (const invoice of openInvoices) {
      const subscription = await this.prisma.subscription.findUnique({
        where: {
          id: invoice.subscriptionID
        }
      })
      if (!subscription) {
        logger('memberContext').warn('subscription %s does not exist', invoice.subscriptionID)
        continue
      }

      if (invoice.sentReminderAt) {
        const {nextReminder, deactivateSubscription} = getNextReminderAndDeactivationDate({
          sentReminderAt: invoice.sentReminderAt,
          createdAt: invoice.createdAt
        })

        if (nextReminder > today) {
          continue // skip reminder if not enough days passed
        }

        if (deactivateSubscription < today) {
          await this.prisma.invoice.update({
            where: {id: invoice.id},
            data: {
              ...invoice,
              canceledAt: today
            }
          })
          await this.deactivateSubscriptionForUser({
            subscriptionID: subscription.id,
            deactivationDate: today,
            deactivationReason: SubscriptionDeactivationReason.InvoiceNotPaid
          })
          continue
        }
      }

      const user = await this.prisma.user.findUnique({
        where: {id: subscription.userID}
      })

      if (!user) {
        logger('memberContext').warn('user %s not found', subscription.userID)
        continue
      }

      if (!user.active) {
        logger('memberContext').warn('user %s is not active', user.id)
        continue
      }

      const paymentMethod = await this.loaders.paymentMethodsByID.load(subscription.paymentMethodID)
      if (!paymentMethod) {
        logger('memberContext').warn('paymentMethod %s not found', subscription.paymentMethodID)
        continue
      }

      if (offSessionPaymentProvidersID.includes(paymentMethod.paymentProviderID)) {
        const customer = user.paymentProviderCustomers.find(
          ppc => ppc.paymentProviderID === paymentMethod.paymentProviderID
        )
        if (!customer) {
          logger('memberContext').warn(
            'PaymentCustomer %s on user %s not found',
            paymentMethod.paymentProviderID,
            user.id
          )
          await this.mailContext.sendMail({
            type: SendMailType.MemberSubscriptionOffSessionFailed,
            recipient: invoice.mail,
            data: {
              user,
              ...(user ? {loginURL: this.getLoginUrlForUser(user)} : {}),
              invoice,
              paymentProviderID: paymentMethod.paymentProviderID,
              errorCode: 'customer_missing',
              subscription
            }
          })
          continue
        }

        await this.chargeInvoice({
          user,
          invoice,
          paymentMethodID: paymentMethod.id,
          customer
        })
      }
    }
  }

  async chargeInvoice({
    user,
    invoice,
    paymentMethodID,
    customer
  }: ChargeInvoiceProps): Promise<void> {
    const offSessionPaymentProvidersID = this.getOffSessionPaymentProviderIDs()
    const paymentMethods = await this.prisma.paymentMethod.findMany()
    const paymentMethodIDs = paymentMethods
      .filter(method => offSessionPaymentProvidersID.includes(method.paymentProviderID))
      .map(method => method.id)

    if (!paymentMethodIDs.includes(paymentMethodID)) {
      logger('memberContext').warn(
        'PaymentMethod %s does not support off session payments',
        paymentMethodID
      )
      return
    }

    const paymentMethod = paymentMethods.find(method => method.id === paymentMethodID)
    if (!paymentMethod) {
      logger('memberContext').error('PaymentMethod %s does not exist', paymentMethodID)
      return
    }

    const paymentProvider = this.paymentProviders.find(
      provider => provider.id === paymentMethod.paymentProviderID
    )

    if (!paymentProvider) {
      logger('memberContext').error(
        'PaymentProvider %s does not exist',
        paymentMethod.paymentProviderID
      )
      return
    }

    const payment = await this.prisma.payment.create({
      data: {
        paymentMethodID,
        invoiceID: invoice.id,
        state: PaymentState.Created,
        modifiedAt: new Date()
      }
    })

    const intent = await paymentProvider.createIntent({
      paymentID: payment.id,
      invoice,
      saveCustomer: false,
      customerID: customer.customerID
    })

    await this.dbAdapter.payment.updatePayment({
      id: payment.id,
      input: {
        state: intent.state,
        intentID: intent.intentID,
        intentData: intent.intentData,
        intentSecret: intent.intentSecret,
        paymentData: intent.paymentData,
        paymentMethodID: payment.paymentMethodID,
        invoiceID: payment.invoiceID
      }
    })

    if (intent.state === PaymentState.RequiresUserAction) {
      await this.mailContext.sendMail({
        type: SendMailType.MemberSubscriptionOffSessionFailed,
        recipient: invoice.mail,
        data: {
          user,
          ...(user ? {loginURL: this.getLoginUrlForUser(user)} : {}),
          invoice,
          paymentProviderID: paymentProvider.id,
          errorCode: intent.errorCode
        }
      })

      await this.prisma.invoice.update({
        where: {id: invoice.id},
        data: {
          ...invoice,
          sentReminderAt: new Date()
        }
      })
    }
  }

  async sendReminderForInvoices({replyToAddress}: SendReminderForInvoicesProps): Promise<void> {
    const today = new Date()

    const openInvoices = await this.getAllOpenInvoices()
    if (openInvoices.length === 0) {
      logger('memberContext').info('No open invoices to remind')
    }

    for (const invoice of openInvoices) {
      const subscription = await this.prisma.subscription.findUnique({
        where: {
          id: invoice.subscriptionID
        }
      })
      if (!subscription) {
        logger('memberContext').warn('subscription %s does not exist', invoice.subscriptionID)
        continue
      }

      if (invoice.sentReminderAt) {
        const {nextReminder, deactivateSubscription} = getNextReminderAndDeactivationDate({
          sentReminderAt: invoice.sentReminderAt,
          createdAt: invoice.createdAt
        })

        if (nextReminder > today) {
          continue // skip reminder if not enough days passed
        }

        if (deactivateSubscription < today) {
          await this.prisma.invoice.update({
            where: {id: invoice.id},
            data: {
              ...invoice,
              canceledAt: today
            }
          })

          await this.deactivateSubscriptionForUser({
            subscriptionID: subscription.id,
            deactivationDate: today,
            deactivationReason: SubscriptionDeactivationReason.InvoiceNotPaid
          })
          continue
        }
      }

      const user = await this.prisma.user.findUnique({
        where: {id: subscription.userID}
      })

      if (!user) {
        logger('memberContext').warn('user %s not found', subscription.userID)
        continue
      }

      if (!user.active) {
        logger('memberContext').warn('user %s is not active', user.id)
        continue
      }

      try {
        await this.sendReminderForInvoice({
          invoice,
          replyToAddress
        })
      } catch (error) {
        logger('memberContext').error(error as Error, 'Error while sending reminder')
      }
    }
  }

  async sendReminderForInvoice({
    invoice,
    replyToAddress
  }: SendReminderForInvoiceProps): Promise<void> {
    const today = new Date()

    const subscription = await this.prisma.subscription.findUnique({
      where: {
        id: invoice.subscriptionID
      }
    })
    const user = subscription?.userID
      ? await this.prisma.user.findUnique({
          where: {
            id: subscription.userID
          }
        })
      : null
    const paymentMethod = subscription
      ? await this.loaders.paymentMethodsByID.load(subscription.paymentMethodID)
      : null
    const paymentProvider = paymentMethod?.paymentProviderID
      ? this.paymentProviders.find(provider => provider.id === paymentMethod.paymentProviderID)
      : null
    const offSessionPayments = paymentProvider?.offSessionPayments ?? false
    if (offSessionPayments) {
      if (invoice.dueAt > today) {
        await this.mailContext.sendMail({
          type: SendMailType.MemberSubscriptionOffSessionBefore,
          recipient: invoice.mail,
          data: {
            invoice,
            user,
            ...(user ? {loginURL: this.getLoginUrlForUser(user)} : {}),
            subscription
          }
        })
      } else {
        // system will try to bill every night and send error to user.
      }
    } else {
      if (invoice.dueAt > today) {
        await this.mailContext.sendMail({
          type: SendMailType.MemberSubscriptionOnSessionBefore,
          recipient: invoice.mail,
          data: {
            invoice,
            user,
            ...(user ? {loginURL: this.getLoginUrlForUser(user)} : {}),
            subscription
          }
        })
      } else {
        await this.mailContext.sendMail({
          type: SendMailType.MemberSubscriptionOnSessionAfter,
          recipient: invoice.mail,
          data: {
            invoice,
            user,
            ...(user ? {loginURL: this.getLoginUrlForUser(user)} : {}),
            subscription
          }
        })
      }
    }

    await this.prisma.invoice.update({
      where: {id: invoice.id},
      data: {
        ...invoice,
        sentReminderAt: today
      }
    })
  }

  async deactivateSubscriptionForUser({
    subscriptionID,
    deactivationDate,
    deactivationReason
  }: DeactivateSubscriptionForUserProps): Promise<void> {
    const subscription = await this.prisma.subscription.findUnique({
      where: {id: subscriptionID}
    })

    if (!subscription) {
      logger('memberContext').info('Subscription with id "%s" does not exist', subscriptionID)
      return
    }

    await this.dbAdapter.subscription.updateSubscription({
      id: subscriptionID,
      input: {
        ...subscription,
        paymentPeriodicity: subscription.paymentPeriodicity as PaymentPeriodicity,
        deactivation: {
          date: deactivationDate ?? subscription.paidUntil ?? new Date(),
          reason: deactivationReason ?? SubscriptionDeactivationReason.None
        }
      }
    })
  }

  /**
   * Function used to
   * @param memberPlanID
   * @param memberPlanSlug
   * @param paymentMethodID
   * @param paymentMethodSlug
   */

  async validateInputParamsCreateSubscription(
    memberPlanID: string | null,
    memberPlanSlug: string | null,
    paymentMethodID: string | null,
    paymentMethodSlug: string | null
  ) {
    if (
      (memberPlanID == null && memberPlanSlug == null) ||
      (memberPlanID != null && memberPlanSlug != null)
    ) {
      throw new UserInputError('You must provide either `memberPlanID` or `memberPlanSlug`.')
    }

    if (
      (paymentMethodID == null && paymentMethodSlug == null) ||
      (paymentMethodID != null && paymentMethodSlug != null)
    ) {
      throw new UserInputError('You must provide either `paymentMethodID` or `paymentMethodSlug`.')
    }
  }

  async getMemberPlanByIDOrSlug(
    loaders: DataLoaderContext,
    memberPlanSlug: string,
    memberPlanID: string
  ) {
    const memberPlan = memberPlanID
      ? await loaders.activeMemberPlansByID.load(memberPlanID)
      : await loaders.activeMemberPlansBySlug.load(memberPlanSlug)
    if (!memberPlan) throw new NotFound('MemberPlan', memberPlanID || memberPlanSlug)
    return memberPlan
  }

  async getPaymentMethodByIDOrSlug(
    loaders: DataLoaderContext,
    paymentMethodSlug: string,
    paymentMethodID: string
  ) {
    const paymentMethod = paymentMethodID
      ? await loaders.activePaymentMethodsByID.load(paymentMethodID)
      : await loaders.activePaymentMethodsBySlug.load(paymentMethodSlug)
    if (!paymentMethod) throw new NotFound('PaymentMethod', paymentMethodID || paymentMethodSlug)
    return paymentMethod
  }

  async validateSubscriptionPaymentConfiguration(
    memberPlan: MemberPlan,
    autoRenew: boolean,
    paymentPeriodicity: PaymentPeriodicity,
    paymentMethod: PaymentMethod
  ) {
    if (
      !memberPlan.availablePaymentMethods.some(apm => {
        if (apm.forceAutoRenewal && !autoRenew) return false
        return (
          apm.paymentPeriodicities.includes(paymentPeriodicity) &&
          apm.paymentMethodIDs.includes(paymentMethod.id)
        )
      })
    )
      throw new PaymentConfigurationNotAllowed()
  }

  async processSubscriptionProperties(
    subscriptionProperties: Omit<MetadataProperty, 'public'>[]
  ): Promise<MetadataProperty[]> {
    return Array.isArray(subscriptionProperties)
      ? subscriptionProperties.map(property => {
          return {
            public: true,
            key: property.key,
            value: property.value
          }
        })
      : []
  }

  async createSubscription(
    subscriptionClient: PrismaClient['subscription'],
    userID: string,
    paymentMethod: PaymentMethod,
    paymentPeriodicity: PaymentPeriodicity,
    monthlyAmount: number,
    memberPlan: MemberPlan,
    properties: MetadataProperty[],
    autoRenew: boolean
  ) {
    const subscription = await subscriptionClient.create({
      data: {
        userID,
        startsAt: new Date(),
        modifiedAt: new Date(),
        paymentMethodID: paymentMethod.id,
        paymentPeriodicity,
        paidUntil: null,
        monthlyAmount,
        deactivation: null,
        memberPlanID: memberPlan.id,
        properties,
        autoRenew
      }
    })

    if (!subscription) {
      logger('mutation.public').error('Could not create new subscription for userID "%s"', userID)
      throw new InternalError()
    }
    return subscription
  }
}
