import {Context} from './context'
import {DateFilterComparison, InputCursor, LimitType, SortOrder} from './db/common'
import {InvoiceSort} from './db/invoice'
import {PaymentState} from './db/payment'
import {logger} from './server'
import {ONE_DAY_IN_MILLISECONDS, ONE_HOUR_IN_MILLISECONDS} from './utility'

// const SEND_INVOICE_REMINDERS_EVERY_3_DAYS = ONE_DAY_IN_MILLISECONDS * 3

export enum JobType {
  DailyMembershipRenewal = 'dailyMembershipRenewal',
  DailyInvoiceCharger = 'dailyInvoiceCharger',
  DailyInvoiceReminder = 'dailyInvoiceReminder',
  SendTestMail = 'sendTestMail'
}

async function dailyMembershipRenewal(context: Context, data: any): Promise<void> {
  logger('jobs').info('starting dailyMembershipRenewal')

  const daysToLookAhead = 7
  const startDate = data?.startDate ? new Date(data?.startDate) : new Date()
  await context.memberContext.renewSubscriptionForUsers({
    startDate,
    daysToLookAhead
  })
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
