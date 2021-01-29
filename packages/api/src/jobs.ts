import {Context} from './context'
import {logger} from './server'

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
  logger('jobs').info('starting dailyInvoiceCharger')
  await context.memberContext.chargeOpenInvoices()
  logger('jobs').info('finishing dailyInvoiceCharger')
}

async function dailyInvoiceReminder(context: Context, data: any): Promise<void> {
  logger('jobs').info('starting dailyInvoiceReminder')

  const {userPaymentURL, replyToAddress, sendEveryDays = 3} = data

  if (!replyToAddress) {
    throw new Error('No replyToAddress provided')
  }

  if (!userPaymentURL) {
    throw new Error('No userPaymentURL provided')
  }

  await context.memberContext.sendReminderForInvoices({
    replyToAddress,
    userPaymentURL,
    sendEveryDays
  })
  logger('jobs').info('finishing dailyInvoiceReminder')
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
