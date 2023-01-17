import {Context} from './context'
import {logger} from './server'
import {SendMailType} from './mails/mailContext'

export enum JobType {
  DailyMembershipRenewal = 'dailyMembershipRenewal',
  DailyInvoiceChecker = 'dailyInvoiceChecker',
  DailyInvoiceCharger = 'dailyInvoiceCharger',
  DailyInvoiceReminder = 'dailyInvoiceReminder',
  SendTestMail = 'sendTestMail'
}

async function dailyMembershipRenewal(context: Context, data: any): Promise<void> {
  logger('jobs').info('starting dailyMembershipRenewal')

  const daysToLookAhead = 10
  const startDate = data?.startDate ? new Date(data?.startDate) : new Date()
  await context.memberContext.renewSubscriptionForUsers({
    startDate,
    daysToLookAhead
  })
  logger('jobs').info('finishing dailyMembershipRenewal')
}

async function dailyInvoiceChecker(context: Context): Promise<void> {
  logger('jobs').info('starting dailyInvoiceChecker')
  await context.memberContext.checkOpenInvoices()
  logger('jobs').info('finishing dailyInvoiceChecker')
}

async function dailyInvoiceCharger(context: Context): Promise<void> {
  logger('jobs').info('starting dailyInvoiceCharger')
  await context.memberContext.chargeOpenInvoices()
  logger('jobs').info('finishing dailyInvoiceCharger')
}

async function dailyInvoiceReminder(context: Context, data: any): Promise<void> {
  logger('jobs').info('starting dailyInvoiceReminder')

  const {replyToAddress} = data

  if (!replyToAddress) {
    throw new Error('No replyToAddress provided')
  }

  await context.memberContext.sendReminderForInvoices({
    replyToAddress
  })
  logger('jobs').info('finishing dailyInvoiceReminder')
}

async function sendTestMail(context: Context, data: any): Promise<void> {
  const {recipient = 'fake@fake.com', message = 'This is a test message'} = data

  await context.mailContext.sendMail({
    type: SendMailType.TestMail,
    recipient,
    data: {
      message
    }
  })
}

export async function runJob(command: JobType, context: Context, data: any): Promise<void> {
  switch (command) {
    case JobType.DailyMembershipRenewal:
      await dailyMembershipRenewal(context, data)
      break
    case JobType.DailyInvoiceChecker:
      await dailyInvoiceChecker(context)
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
