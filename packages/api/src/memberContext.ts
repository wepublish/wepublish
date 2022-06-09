import {OptionalUser, PaymentProviderCustomer, User} from './db/user'
import {Invoice, InvoiceSort, OptionalInvoice} from './db/invoice'
import {DBAdapter} from './db/adapter'
import {logger} from './server'
import {DataLoaderContext} from './context'
import {
  isTempUser,
  ONE_DAY_IN_MILLISECONDS,
  ONE_HOUR_IN_MILLISECONDS,
  ONE_MONTH_IN_MILLISECONDS,
  removePrefixTempUser
} from './utility'
import {PaymentPeriodicity, MemberPlan} from './db/memberPlan'
import {DateFilterComparison, InputCursor, LimitType, SortOrder} from './db/common'
import {PaymentState} from './db/payment'
import {PaymentProvider} from './payments/paymentProvider'
import {MailContext, SendMailType} from './mails/mailContext'
import {
  Subscription,
  SubscriptionDeactivationReason,
  SubscriptionSort,
  OptionalSubscription
} from './db/subscription'
import {InternalError, NotFound, PaymentConfigurationNotAllowed, UserInputError} from './error'
import {PaymentMethod} from './db/paymentMethod'
import {OptionalTempUser, UserIdWithTempPrefix} from './db/tempUser'

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
  loaders: DataLoaderContext
  paymentProviders: PaymentProvider[]

  mailContext: MailContext
  getLoginUrlForUser(user: User): string

  handleSubscriptionChange(props: HandleSubscriptionChangeProps): Promise<Subscription>

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

export function getNextDateForPeriodicity(start: Date, periodicity: PaymentPeriodicity): Date {
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

export function calculateAmountForPeriodicity(
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
    const invoices = await this.dbAdapter.invoice.getInvoicesBySubscriptionID(subscription.id)

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
      if (openInvoice) await this.dbAdapter.invoice.deleteInvoice({id: openInvoice.id})

      const finalUpdatedSubscription = await this.dbAdapter.subscription.getSubscriptionByID(
        subscription.id
      )
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
  }: RenewSubscriptionForUserProps): Promise<OptionalInvoice> {
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
        const invoice = await this.dbAdapter.invoice.getInvoiceByID(period.invoiceID)
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
      const nextDate = getNextDateForPeriodicity(startDate, subscription.paymentPeriodicity)
      const amount = calculateAmountForPeriodicity(
        subscription.monthlyAmount,
        subscription.paymentPeriodicity
      )

      const user = isTempUser(subscription.userID)
        ? await this.dbAdapter.tempUser.getTempUserByID(removePrefixTempUser(subscription.userID))
        : await this.dbAdapter.user.getUserByID(subscription.userID)

      if (!user) {
        logger('memberContext').info('User with id "%s" not found', subscription.userID)
        return null
      }

      const newInvoice = await this.dbAdapter.invoice.createInvoice({
        input: {
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
          canceledAt: null
        }
      })
      await this.dbAdapter.subscription.addSubscriptionPeriod({
        subscriptionID: subscription.id,
        input: {
          amount,
          paymentPeriodicity: subscription.paymentPeriodicity,
          startsAt: startDate,
          endsAt: nextDate,
          invoiceID: newInvoice.id
        }
      })
      logger('memberContext').info('Renewed subscription with id %s', subscription.id)
      return newInvoice
    } catch (error) {
      logger('memberContext').error(
        error,
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
    let skip = 0
    while (hasMore) {
      const subscriptions = await this.dbAdapter.subscription.getSubscriptions({
        cursor: InputCursor(),
        limit: {count: 100, type: LimitType.First, skip},
        order: SortOrder.Ascending,
        sort: SubscriptionSort.CreatedAt,
        filter: {
          autoRenew: true,
          paidUntil: {date: lookAheadDate, comparison: DateFilterComparison.LowerThanOrEqual},
          deactivationDate: {date: null, comparison: DateFilterComparison.Equal}
        }
      })

      hasMore = subscriptions.pageInfo.hasNextPage
      skip += 100
      subscriptionsPaidUntil.push(...subscriptions.nodes)
    }

    const subscriptionPaidNull: Subscription[] = []
    hasMore = true
    skip = 0
    while (hasMore) {
      const subscriptions = await this.dbAdapter.subscription.getSubscriptions({
        cursor: InputCursor(),
        limit: {count: 100, type: LimitType.First, skip},
        order: SortOrder.Ascending,
        sort: SubscriptionSort.CreatedAt,
        filter: {
          autoRenew: true,
          paidUntil: {date: null, comparison: DateFilterComparison.Equal},
          deactivationDate: {date: null, comparison: DateFilterComparison.Equal}
        }
      })

      hasMore = subscriptions.pageInfo.hasNextPage
      skip += 100
      subscriptionPaidNull.push(...subscriptions.nodes)
    }

    for (const subscription of [...subscriptionsPaidUntil, ...subscriptionPaidNull]) {
      await this.renewSubscriptionForUser({subscription})
    }
  }

  async checkOpenInvoices(): Promise<void> {
    const openInvoices = await this.getAllOpenInvoices()
    for (const invoice of openInvoices) {
      const subscription = await this.dbAdapter.subscription.getSubscriptionByID(
        invoice.subscriptionID
      )
      if (!subscription) {
        logger('memberContext').warn('subscription "%s" not found', invoice.subscriptionID)
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

  /**
   * Create regular user out of temp user and activate subscription
   * @param dbAdapter
   * @param userID
   * @param subscription
   * @private
   */
  public async activateTempUser(
    dbAdapter: DBAdapter,
    userID: UserIdWithTempPrefix,
    subscription: OptionalSubscription
  ): Promise<OptionalSubscription> {
    // create non-temp user id
    const tempUserId = removePrefixTempUser(userID)
    const tempUser: OptionalTempUser = await dbAdapter.tempUser.getTempUserByID(tempUserId)
    if (!tempUser) {
      throw new Error('User not found while updating payment with intent state.')
    }

    // creating the new user out of the existing temp_user
    const user: OptionalUser = await dbAdapter.user.createUserFromTempUser(tempUser)

    if (!user) {
      throw new Error('User could not be created from temp user.')
    }

    if (!subscription) {
      throw new Error('Subscription is empty within activateTempUser method.')
    }
    // update userID of subscription
    subscription = await dbAdapter.subscription.updateUserID(subscription.id, user.id)
    if (!subscription) {
      throw new Error('Subscription could not be activated.')
    }
    return subscription
  }

  private async getAllOpenInvoices(): Promise<Invoice[]> {
    const openInvoices: Invoice[] = []
    let hasMore = true
    let skip = 0
    while (hasMore) {
      const invoices = await this.dbAdapter.invoice.getInvoices({
        cursor: InputCursor(),
        limit: {count: 100, type: LimitType.First, skip},
        order: SortOrder.Ascending,
        sort: InvoiceSort.CreatedAt,
        filter: {
          paidAt: {
            comparison: DateFilterComparison.Equal,
            date: null
          },
          canceledAt: {
            comparison: DateFilterComparison.Equal,
            date: null
          }
        }
      })

      hasMore = invoices.pageInfo.hasNextPage
      skip += 100
      openInvoices.push(...invoices.nodes)
    }

    return openInvoices
  }

  async chargeOpenInvoices(): Promise<void> {
    const today = new Date()
    const openInvoices = await this.getAllOpenInvoices()
    const offSessionPaymentProvidersID = this.getOffSessionPaymentProviderIDs()

    for (const invoice of openInvoices) {
      const subscription = await this.dbAdapter.subscription.getSubscriptionByID(
        invoice.subscriptionID
      )
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
          await this.dbAdapter.invoice.updateInvoice({
            id: invoice.id,
            input: {
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
      const user = await this.dbAdapter.user.getUserByID(subscription.userID)
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
          ...(user ? {loginURL: this.getLoginUrlForUser(user)} : {}),
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

    const openInvoices = await this.getAllOpenInvoices()
    if (openInvoices.length === 0) {
      logger('memberContext').info('No open invoices to remind')
    }

    for (const invoice of openInvoices) {
      const subscription = await this.dbAdapter.subscription.getSubscriptionByID(
        invoice.subscriptionID
      )
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
          await this.dbAdapter.invoice.updateInvoice({
            id: invoice.id,
            input: {
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

      const user = await this.dbAdapter.user.getUserByID(subscription.userID)
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
        logger('memberContext').error(error, 'Error while sending reminder')
      }
    }
  }

  async sendReminderForInvoice({
    invoice,
    replyToAddress
  }: SendReminderForInvoiceProps): Promise<void> {
    const today = new Date()

    const subscription = await this.dbAdapter.subscription.getSubscriptionByID(
      invoice.subscriptionID
    )
    const user = subscription?.userID
      ? await this.dbAdapter.user.getUserByID(subscription?.userID)
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

    await this.dbAdapter.invoice.updateInvoice({
      id: invoice.id,
      input: {
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
    const subscription = await this.dbAdapter.subscription.getSubscriptionByID(subscriptionID)
    if (!subscription) {
      logger('memberContext').info('Subscription with id "%s" does not exist', subscriptionID)
      return
    }

    await this.dbAdapter.subscription.updateSubscription({
      id: subscriptionID,
      input: {
        ...subscription,
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

  async processSubscriptionProperties(subscriptionProperties: any) {
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
    dbAdapter: DBAdapter,
    userID: string,
    paymentMethod: PaymentMethod,
    paymentPeriodicity: PaymentPeriodicity,
    monthlyAmount: number,
    memberPlan: MemberPlan,
    properties: any,
    autoRenew: boolean
  ) {
    const subscription = await dbAdapter.subscription.createSubscription({
      input: {
        userID,
        startsAt: new Date(),
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
