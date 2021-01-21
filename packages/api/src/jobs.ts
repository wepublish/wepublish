import {Context} from './context'
import {DateFilterComparison, InputCursor, LimitType, SortOrder} from './db/common'
import {UserSort} from './db/user'
import {PaymentPeriodicity} from './db/memberPlan'
import {InvoiceSort} from './db/invoice'
import {PaymentState} from './db/payment'
import {logger} from './server'

const ONE_HOUR_IN_MILLISECONDS = 60 * 60 * 1000
const ONE_DAY_IN_MILLISECONDS = 24 * ONE_HOUR_IN_MILLISECONDS

// const SEND_INVOICE_REMINDERS_EVERY_3_DAYS = ONE_DAY_IN_MILLISECONDS * 3

export enum JobType {
  DailyMembershipRenewal = 'dailyMembershipRenewal',
  DailyInvoiceCharger = 'dailyInvoiceCharger',
  DailyInvoiceReminder = 'dailyInvoiceReminder',
  SendTestMail = 'sendTestMail'
}

function getNextDateForPeriodicity(start: Date, periodicity: PaymentPeriodicity): Date {
  start = new Date(start) // create new Date object
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

async function dailyMembershipRenewal(context: Context, data: any): Promise<void> {
  logger('jobs').info('starting dailyMembershipRenewal')
  const {dbAdapter} = context

  const startDate = data?.startDate ? new Date(data?.startDate) : new Date()
  const inAWeek = new Date(startDate.getTime() + 7 * ONE_DAY_IN_MILLISECONDS)

  const usersPaidUntil = await dbAdapter.user.getUsers({
    filter: {
      subscription: {
        autoRenew: true,
        paidUntil: {date: inAWeek, comparison: DateFilterComparison.LowerThanOrEqual},
        deactivatedAt: {date: null, comparison: DateFilterComparison.Equal}
      }
    },
    limit: {type: LimitType.First, count: 200},
    order: SortOrder.Ascending,
    sort: UserSort.CreatedAt,
    cursor: InputCursor()
  })

  const usersPaidNull = await dbAdapter.user.getUsers({
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

  const users = [...usersPaidUntil.nodes, ...usersPaidNull.nodes]

  for (const user of users) {
    try {
      const {subscription} = user
      if (!subscription) continue // TODO: log warning
      const {periods = [], paidUntil} = subscription
      periods.sort((periodA, periodB) => {
        if (periodA.endsAt < periodB.endsAt) return -1
        if (periodA.endsAt > periodB.endsAt) return 1
        return 0
      })
      if (
        periods.length > 0 &&
        (periods[periods.length - 1].endsAt > inAWeek ||
          (paidUntil !== null && periods[periods.length - 1].endsAt > paidUntil))
      )
        continue
      // if (paidUntil !== null && periods.length > 0 && periods[periods.length -1].endsAt > paidUntil) continue
      // TODO: implement check if paidUntil is super long time ago
      const startDate = new Date(
        paidUntil ? paidUntil.getTime() + 1 * ONE_DAY_IN_MILLISECONDS : new Date().getTime()
      )
      const nextDate = getNextDateForPeriodicity(startDate, subscription.paymentPeriodicity)
      const amount = calculateAmountForPeriodicity(
        subscription.monthlyAmount,
        subscription.paymentPeriodicity
      )

      const newInvoice = await dbAdapter.invoice.createInvoice({
        input: {
          userID: user.id,
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

      await dbAdapter.user.addUserSubscriptionPeriod({
        userID: user.id,
        input: {
          amount,
          paymentPeriodicity: subscription.paymentPeriodicity,
          startsAt: startDate,
          endsAt: nextDate,
          invoiceID: newInvoice.id
        }
      })

      console.log(`
        Create new Period for user ${user.name}
        from: ${startDate.toISOString()}
        to: ${nextDate.toISOString()}
        for: ${amount}
    `)
    } catch (error) {
      console.warn('Error while creating new periods', error)
    }
  }
  logger('jobs').info('finishing dailyMembershipRenewal')
}

async function dailyInvoiceCharger(context: Context): Promise<void> {
  const {dbAdapter, paymentProviders} = context
  const offSessionPaymentProvidersID = paymentProviders
    .filter(provider => provider.offSessionPayments)
    .map(provider => provider.id)

  const paymentMethods = await dbAdapter.paymentMethod.getPaymentMethods()
  const paymentMethodIDs = paymentMethods
    .filter(method => offSessionPaymentProvidersID.includes(method.paymentProviderID))
    .map(method => method.id)

  const invoices = await dbAdapter.invoice.getInvoices({
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
      console.warn('Invoice without userID', invoice)
      continue
    }

    const user = await dbAdapter.user.getUserByID(invoice.userID)
    if (!user || !user.subscription) {
      console.warn('User does not exist')
      continue
    }

    if (paymentMethodIDs.includes(user.subscription.paymentMethodID)) {
      const payment = await dbAdapter.payment.createPayment({
        input: {
          paymentMethodID: user.subscription.paymentMethodID,
          invoiceID: invoice.id,
          state: PaymentState.Created
        }
      })

      const paymentMethod = paymentMethods.find(
        method => method.id === user?.subscription?.paymentMethodID
      )
      if (!paymentMethod) {
        console.warn('Payment Method does not exist')
        continue
      }
      const paymentProvider = paymentProviders.find(
        provider => provider.id === paymentMethod.paymentProviderID
      )
      if (!paymentProvider) {
        console.warn('Payment Method does not exist')
        continue
      }

      const customerID = user.paymentProviderCustomers[paymentProvider.id]

      if (!customerID) {
        console.warn('Customer ID does not exist')
      }

      const intent = await paymentProvider.createIntent({
        paymentID: payment.id,
        invoice,
        saveCustomer: false,
        customerID: customerID.id
      })

      await dbAdapter.payment.updatePayment({
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
    }
  }
}

async function dailyInvoiceReminder(context: Context, data: any): Promise<void> {
  const {dbAdapter, loaders, paymentProviders} = context

  const {userPaymentURL, replyToAddress, sendEveryDays = 3} = data

  if (!replyToAddress) {
    throw new Error('No replyToAddress provided')
  }

  if (!userPaymentURL) {
    throw new Error('No userPaymentURL provided')
  }

  const invoices = await dbAdapter.invoice.getInvoices({
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

  const today = new Date()

  if (invoices.nodes.length === 0) {
    console.log('no open invoices to remind')
  }

  for (const invoice of invoices.nodes) {
    try {
      if (
        invoice.sentReminderAt &&
        new Date(
          invoice.sentReminderAt.getTime() +
            sendEveryDays * ONE_DAY_IN_MILLISECONDS -
            ONE_HOUR_IN_MILLISECONDS
        ) > today
      ) {
        continue // skip reminder if not enough days passed
      }

      const user = invoice.userID ? await dbAdapter.user.getUserByID(invoice.userID) : null
      const paymentMethod = user?.subscription
        ? await loaders.paymentMethodsByID.load(user.subscription.paymentMethodID)
        : null
      const paymentProvider = paymentMethod?.paymentProviderID
        ? paymentProviders.find(provider => provider.id === paymentMethod.paymentProviderID)
        : null
      const offSessionPayments = paymentProvider?.offSessionPayments ?? false
      if (offSessionPayments) {
        if (invoice.dueAt > today) {
          await context.sendMailFromProvider({
            replyToAddress,
            message: `We will try to bill your cc in ${invoice.dueAt.toISOString()}. 
            If you want to change the amount, paymentMethod or something else. PLease use the link:
            ${userPaymentURL}?invoice=${invoice.id}`,
            recipient: invoice.mail,
            subject: 'New invoice'
          })
        } else {
          continue
          // system will try to bill every night and send error to user.
        }
      } else {
        if (invoice.dueAt > today) {
          await context.sendMailFromProvider({
            replyToAddress,
            message: `You have a new invoice open which is due at  ${invoice.dueAt.toISOString()}. 
            Click the link to pay:
            ${userPaymentURL}?invoice=${invoice.id}`,
            recipient: invoice.mail,
            subject: 'New invoice'
          })
        } else {
          // Send message => "Your invoice is due since ${days}. Please click link to pay. Your account will be suspended..."
          await context.sendMailFromProvider({
            replyToAddress,
            message: `Your invoice is due since ${invoice.dueAt.toISOString()}. 
            Please click the link to pay otherwise your account will be suspended:
            ${userPaymentURL}?invoice=${invoice.id}`,
            recipient: invoice.mail,
            subject: 'New invoice'
          })
        }
      }

      await dbAdapter.invoice.updateInvoice({
        id: invoice.id,
        input: {
          ...invoice,
          sentReminderAt: today
        }
      })
    } catch (error) {
      console.warn('Error while send invoice reminder', error)
    }
  }
}

async function sendTestMail(context: Context, data: any): Promise<void> {
  throw new Error('uncaught error')
  const {
    subject = 'Test Mail',
    recipient = 'fake@fake.com',
    message = 'This is a test message',
    replyToAddress = 'no-reply@fake.com'
  } = data
  await context.sendMailFromProvider({
    subject,
    recipient,
    message,
    replyToAddress
  })
}

export async function runJob(command: JobType, context: Context, data: any): Promise<void> {
  switch (command) {
    case JobType.DailyMembershipRenewal:
      await dailyMembershipRenewal(context, data)
      break
    case JobType.SendTestMail:
      await sendTestMail(context, data)
      break
    case JobType.DailyInvoiceReminder:
      await dailyInvoiceReminder(context, data)
      break
    case JobType.DailyInvoiceCharger:
      await dailyInvoiceCharger(context)
      break
  }
}
