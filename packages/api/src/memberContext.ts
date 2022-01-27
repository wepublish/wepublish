import {
  PaymentProviderCustomer,
  SubscriptionDeactivationReason,
  User,
  UserSort,
  UserSubscription
} from './db/user'
import {Invoice, InvoiceSort, OptionalInvoice} from './db/invoice'
import {DBAdapter} from './db/adapter'
import {logger} from './server'
import {DataLoaderContext} from './context'
import {
  ONE_DAY_IN_MILLISECONDS,
  ONE_HOUR_IN_MILLISECONDS,
  ONE_MONTH_IN_MILLISECONDS
} from './utility'
import {PaymentPeriodicity} from './db/memberPlan'
import {DateFilterComparison, InputCursor, LimitType, SortOrder} from './db/common'
import {PaymentState} from './db/payment'
import {PaymentProvider} from './payments/paymentProvider'
import {MailContext, SendMailType} from './mails/mailContext'

export interface HandleSubscriptionChangeProps {
  userID: string
  userSubscription: UserSubscription
}

export interface RenewSubscriptionForUserProps {
  userID: string
  userEmail: string
  userName: string
  userSubscription: UserSubscription
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
  userID: string
  deactivationDate?: Date
  deactivationReason?: SubscriptionDeactivationReason
}

export interface MemberContext {
  dbAdapter: DBAdapter
  loaders: DataLoaderContext
  paymentProviders: PaymentProvider[]

  mailContext: MailContext
  getLoginUrlForUser(user: User): string

  handleSubscriptionChange(props: HandleSubscriptionChangeProps): Promise<UserSubscription>

  renewSubscriptionForUser(props: RenewSubscriptionForUserProps): Promise<OptionalInvoice>
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
  readonly loaders: DataLoaderContext
  readonly paymentProviders: PaymentProvider[]
  readonly mailContext: MailContext
  getLoginUrlForUser(user: User): string
}

function getNextDateForPeriodicity(start: Date, periodicity: PaymentPeriodicity): Date {
  start = new Date(start.getTime() - ONE_DAY_IN_MILLISECONDS) // create new Date object
  switch (periodicity) {
    case PaymentPeriodicity.Monthly:
      return new Date(start.setMonth(start.getMonth() + 1))
    case PaymentPeriodicity.Quarterly:
      return new Date(start.setMonth(start.getMonth() + 3))
    case PaymentPeriodicity.Biannual:
      return new Date(start.setMonth(start.getMonth() + 6))
    case PaymentPeriodicity.Yearly:
      return new Date(start.setMonth(start.getMonth() + 12))
  }
}

function calculateAmountForPeriodicity(
  monthlyAmount: number,
  periodicity: PaymentPeriodicity
): number {
  switch (periodicity) {
    case PaymentPeriodicity.Monthly:
      return monthlyAmount
    case PaymentPeriodicity.Quarterly:
      return monthlyAmount * 3
    case PaymentPeriodicity.Biannual:
      return monthlyAmount * 6
    case PaymentPeriodicity.Yearly:
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
  const invoiceReminderFrequencyInDays = parseInt(process.env.INVOICE_REMINDER_FREQ ?? '') ?? 3
  const invoiceReminderMaxTries = parseInt(process.env.INVOICE_REMINDER_MAX_TRIES ?? '') ?? 5

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
    userID,
    userSubscription
  }: HandleSubscriptionChangeProps): Promise<UserSubscription> {
    // Check if user has any unpaid Periods and delete them and their invoices if so
    const invoices = await this.dbAdapter.invoice.getInvoicesByUserID(userID)

    const openInvoice = invoices.find(
      invoice => invoice?.paidAt === null && invoice?.canceledAt === null
    )

    if (
      openInvoice ||
      userSubscription.paidUntil === null ||
      userSubscription.paidUntil <= new Date()
    ) {
      const periodToDelete = userSubscription.periods.find(
        period => period.invoiceID === openInvoice?.id
      )
      if (periodToDelete) {
        await this.dbAdapter.user.deleteUserSubscriptionPeriod({
          userID: userID,
          periodID: periodToDelete.id
        })
      }
      if (openInvoice) await this.dbAdapter.invoice.deleteInvoice({id: openInvoice.id})

      const finalUpdatedUser = await this.dbAdapter.user.getUserByID(userID)
      if (!finalUpdatedUser || !finalUpdatedUser.subscription)
        throw new Error('Error during updateSubscription')

      // renew user subscription
      await this.renewSubscriptionForUser({
        userID: finalUpdatedUser.id,
        userSubscription: finalUpdatedUser.subscription,
        userName: finalUpdatedUser.name,
        userEmail: finalUpdatedUser.email
      })

      return finalUpdatedUser.subscription
    }
    return userSubscription
  }

  async renewSubscriptionForUser({
    userID,
    userEmail,
    userName,
    userSubscription
  }: RenewSubscriptionForUserProps): Promise<OptionalInvoice> {
    try {
      const {periods = [], paidUntil, deactivation} = userSubscription

      if (deactivation) {
        logger('memberContext').info(
          'Subscription for user %s is deactivated and will not be renewed',
          userID
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
        return await this.loaders.invoicesByID.load(period.id)
      }

      const startDate = new Date(
        paidUntil && paidUntil.getTime() > new Date().getTime() - ONE_MONTH_IN_MILLISECONDS
          ? paidUntil.getTime() + ONE_DAY_IN_MILLISECONDS
          : new Date().getTime()
      )
      const nextDate = getNextDateForPeriodicity(startDate, userSubscription.paymentPeriodicity)
      const amount = calculateAmountForPeriodicity(
        userSubscription.monthlyAmount,
        userSubscription.paymentPeriodicity
      )

      const newInvoice = await this.dbAdapter.invoice.createInvoice({
        input: {
          userID: userID,
          description: `Membership from ${startDate.toISOString()} for ${userName || userEmail}`,
          mail: userEmail,
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
          canceledAt: null
        }
      })

      await this.dbAdapter.user.addUserSubscriptionPeriod({
        userID: userID,
        input: {
          amount,
          paymentPeriodicity: userSubscription.paymentPeriodicity,
          startsAt: startDate,
          endsAt: nextDate,
          invoiceID: newInvoice.id
        }
      })
      logger('memberContext').info('Renewed subscription for user %s', userID)
      return newInvoice
    } catch (error) {
      logger('memberContext').error(error, 'Error while renewing subscription for user %s', userID)
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

    const usersPaidUntil = await this.dbAdapter.user.getUsers({
      filter: {
        subscription: {
          autoRenew: true,
          paidUntil: {date: lookAheadDate, comparison: DateFilterComparison.LowerThanOrEqual},
          deactivatedAt: {date: null, comparison: DateFilterComparison.Equal}
        }
      },
      limit: {type: LimitType.First, count: 200},
      order: SortOrder.Ascending,
      sort: UserSort.CreatedAt,
      cursor: InputCursor()
    })

    const usersPaidNull = await this.dbAdapter.user.getUsers({
      filter: {
        subscription: {
          autoRenew: true,
          paidUntil: {date: null, comparison: DateFilterComparison.Equal},
          deactivatedAt: {date: null, comparison: DateFilterComparison.Equal}
        }
      },
      limit: {type: LimitType.First, count: 200},
      order: SortOrder.Ascending,
      sort: UserSort.CreatedAt,
      cursor: InputCursor()
    })

    // TODO: Better checking if users need new subscription

    for (const user of [...usersPaidUntil.nodes, ...usersPaidNull.nodes]) {
      if (!user.subscription) {
        logger('memberContext').warn('User %s does not have a subscription')
        continue
      }
      await this.renewSubscriptionForUser({
        userID: user.id,
        userSubscription: user.subscription,
        userName: user.name,
        userEmail: user.email
      })
    }
  }

  async checkOpenInvoices(): Promise<void> {
    const invoices = await this.dbAdapter.invoice.getInvoices({
      filter: {
        paidAt: {
          comparison: DateFilterComparison.Equal,
          date: null
        },
        canceledAt: {
          comparison: DateFilterComparison.Equal,
          date: null
        }
      },
      limit: {type: LimitType.First, count: 200},
      order: SortOrder.Ascending,
      sort: InvoiceSort.CreatedAt,
      cursor: InputCursor()
    })

    for (const invoice of invoices.nodes) {
      if (!invoice.userID) {
        logger('memberContext').warn('invoice %s does not have an user ID', invoice.id)
        continue
      }

      const user = await this.dbAdapter.user.getUserByID(invoice.userID)
      if (!user || !user.subscription) {
        logger('memberContext').warn('user or subscription %s not found', invoice.userID)
        continue
      }

      await this.checkOpenInvoice({invoice})
    }
  }

  async checkOpenInvoice({invoice}: CheckOpenInvoiceProps): Promise<void> {
    const paymentMethods = await this.dbAdapter.paymentMethod.getPaymentMethods()
    const payments = await this.dbAdapter.payment.getPaymentsByInvoiceID(invoice.id)

    for (const payment of payments) {
      if (!payment || !payment.intentID) {
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
          loaders: this.loaders
        })

        // FIXME: We need to implement a way to wait for all the database
        //  event hooks to finish before we return data. Will be solved in WPC-498
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (error) {
        logger('memberContext').error(
          error,
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

  async chargeOpenInvoices(): Promise<void> {
    const today = new Date()
    const invoices = await this.dbAdapter.invoice.getInvoices({
      filter: {
        paidAt: {
          comparison: DateFilterComparison.Equal,
          date: null
        },
        canceledAt: {
          comparison: DateFilterComparison.Equal,
          date: null
        }
      },
      limit: {type: LimitType.First, count: 200},
      order: SortOrder.Ascending,
      sort: InvoiceSort.CreatedAt,
      cursor: InputCursor()
    })

    const offSessionPaymentProvidersID = this.getOffSessionPaymentProviderIDs()

    for (const invoice of invoices.nodes) {
      if (!invoice.userID) {
        logger('memberContext').warn('invoice %s does not have an user ID', invoice.id)
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
          await this.dbAdapter.invoice.updateInvoice({
            id: invoice.id,
            input: {
              ...invoice,
              canceledAt: today
            }
          })
          await this.deactivateSubscriptionForUser({
            userID: invoice.userID,
            deactivationDate: today,
            deactivationReason: SubscriptionDeactivationReason.InvoiceNotPaid
          })
          continue
        }
      }

      const user = await this.dbAdapter.user.getUserByID(invoice.userID)
      if (!user || !user.subscription) {
        logger('memberContext').warn('user or subscription %s not found', invoice.userID)
        continue
      }

      if (!user.active) {
        logger('memberContext').warn('user %s is not active', user.id)
        continue
      }

      const paymentMethod = await this.loaders.paymentMethodsByID.load(
        user.subscription.paymentMethodID
      )
      if (!paymentMethod) {
        logger('memberContext').warn(
          'paymentMethod %s not found',
          user.subscription.paymentMethodID
        )
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
              invoice,
              paymentProviderID: paymentMethod.paymentProviderID,
              errorCode: 'customer_missing'
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
    const paymentMethods = await this.dbAdapter.paymentMethod.getPaymentMethods()
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

    const payment = await this.dbAdapter.payment.createPayment({
      input: {
        paymentMethodID,
        invoiceID: invoice.id,
        state: PaymentState.Created
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
          invoice,
          paymentProviderID: paymentProvider.id,
          errorCode: intent.errorCode
        }
      })

      await this.dbAdapter.invoice.updateInvoice({
        id: invoice.id,
        input: {
          ...invoice,
          sentReminderAt: new Date()
        }
      })
    }
  }

  async sendReminderForInvoices({replyToAddress}: SendReminderForInvoicesProps): Promise<void> {
    const today = new Date()

    const invoices = await this.dbAdapter.invoice.getInvoices({
      filter: {
        paidAt: {
          comparison: DateFilterComparison.Equal,
          date: null
        },
        canceledAt: {
          comparison: DateFilterComparison.Equal,
          date: null
        }
      },
      limit: {type: LimitType.First, count: 200},
      order: SortOrder.Ascending,
      sort: InvoiceSort.CreatedAt,
      cursor: InputCursor()
    })

    if (invoices.nodes.length === 0) {
      logger('memberContext').info('No open invoices to remind')
    }

    for (const invoice of invoices.nodes) {
      if (!invoice.userID) {
        logger('memberContext').warn('invoice %s does not have a user ID', invoice.id)
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
          await this.dbAdapter.invoice.updateInvoice({
            id: invoice.id,
            input: {
              ...invoice,
              canceledAt: today
            }
          })
          await this.deactivateSubscriptionForUser({
            userID: invoice.userID,
            deactivationDate: today,
            deactivationReason: SubscriptionDeactivationReason.InvoiceNotPaid
          })
          continue
        }
      }

      const user = await this.dbAdapter.user.getUserByID(invoice.userID)
      if (!user || !user.subscription) {
        logger('memberContext').warn('user or subscription %s not found', invoice.userID)
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
        logger('memberContext').error(error, 'Error while sending reminder')
      }
    }
  }

  async sendReminderForInvoice({
    invoice,
    replyToAddress
  }: SendReminderForInvoiceProps): Promise<void> {
    const today = new Date()

    const user = invoice.userID ? await this.dbAdapter.user.getUserByID(invoice.userID) : null
    const paymentMethod = user?.subscription
      ? await this.loaders.paymentMethodsByID.load(user.subscription.paymentMethodID)
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
            ...(user ? {loginURL: this.getLoginUrlForUser(user)} : {})
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
            ...(user ? {loginURL: this.getLoginUrlForUser(user)} : {})
          }
        })
      } else {
        await this.mailContext.sendMail({
          type: SendMailType.MemberSubscriptionOnSessionAfter,
          recipient: invoice.mail,
          data: {
            invoice,
            user,
            ...(user ? {loginURL: this.getLoginUrlForUser(user)} : {})
          }
        })
      }
    }

    await this.dbAdapter.invoice.updateInvoice({
      id: invoice.id,
      input: {
        ...invoice,
        sentReminderAt: today
      }
    })
  }

  async deactivateSubscriptionForUser({
    userID,
    deactivationDate,
    deactivationReason
  }: DeactivateSubscriptionForUserProps): Promise<void> {
    const user = await this.dbAdapter.user.getUserByID(userID)
    if (!user || !user.subscription) {
      logger('memberContext').info(
        'User with ID: "%s" does not exist or does not have a subscription for deactivation',
        userID
      )
      return
    }

    await this.dbAdapter.user.updateUserSubscription({
      userID,
      input: {
        ...user.subscription,
        deactivation: {
          date: deactivationDate ?? user.subscription.paidUntil ?? new Date(),
          reason: deactivationReason ?? SubscriptionDeactivationReason.None
        }
      }
    })
  }
}
