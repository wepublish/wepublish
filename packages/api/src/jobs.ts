import {Context} from './context'

export enum JobType {
  DailyMembershipRenewal = 'dailyMembershipRenewal',
  SendTestMail = 'sendTextMail'
}

async function dailyMembershipRenewal(context: Context): Promise<void> {
  // const {dbAdapter} = context
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
      await dailyMembershipRenewal(context)
      break
    case JobType.SendTestMail:
      await sendTestMail(context, data)
      break
  }
}
