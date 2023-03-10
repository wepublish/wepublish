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
  const {today} = data
  if (!today) {
    throw new Error('today not given!')
  }
  await context.memberContext.renewSubscriptionForUsers({
    today,
    daysToLookAhead
  })
  logger('jobs').info('finishing dailyMembershipRenewal')
}

async function dailyInvoiceChecker(context: Context, data: any): Promise<void> {
  logger('jobs').info('starting dailyInvoiceChecker')

  const {today} = data
  if (!today) {
    throw new Error('Today not passed!!!!')
  }

  await context.memberContext.checkOpenInvoices()
  logger('jobs').info('finishing dailyInvoiceChecker')
}

async function dailyInvoiceCharger(context: Context, data: any): Promise<void> {
  logger('jobs').info('starting dailyInvoiceCharger')

  const {today} = data
  if (!today) {
    throw new Error('today not passed!')
  }

  await context.memberContext.chargeOpenInvoices(today)
  logger('jobs').info('finishing dailyInvoiceCharger')
}

async function dailyInvoiceReminder(context: Context, data: any): Promise<void> {
  logger('jobs').info('starting dailyInvoiceReminder')

  const {replyToAddress, today} = data

  if (!replyToAddress) {
    throw new Error('No replyToAddress provided')
  }

  if (!today) {
    throw new Error('today not given!')
  }

  await context.memberContext.sendReminderForInvoices({
    replyToAddress,
    today
  })
  logger('jobs').info('finishing dailyInvoiceReminder')
}

async function sendTestMail(context: Context, data: any): Promise<void> {
  const {recipient = 'fake@fake.com', message = 'This is a test message'} = data

  await context.mailContext.sendMail({
    type: SendMailType.TestMail,
    recipient: recipient,
    data: {
      message
    },
    today: new Date()
  })
}

export async function runJob(command: JobType, context: Context, data: any): Promise<void> {
  switch (command) {
    case JobType.DailyMembershipRenewal:
      await dailyMembershipRenewal(context, data)
      break
    case JobType.DailyInvoiceChecker:
      await dailyInvoiceChecker(context, data)
      break
    case JobType.SendTestMail:
      await sendTestMail(context, data)
      break
    case JobType.DailyInvoiceReminder:
      await dailyInvoiceReminder(context, data)
      break
    case JobType.DailyInvoiceCharger:
      await dailyInvoiceCharger(context, data)
      break
  }
}
