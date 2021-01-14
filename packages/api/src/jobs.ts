import {Context} from './context'
import {DateFilterComparison, InputCursor, LimitType, SortOrder} from './db/common'
import {UserSort} from './db/user'
import {PaymentPeriodicity} from './db/memberPlan'

const ONE_DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000

export enum JobType {
  DailyMembershipRenewal = 'dailyMembershipRenewal',
  SendTestMail = 'sendTestMail'
}

function getNextDateForPeriodicity(start: Date, periodicity: PaymentPeriodicity): Date {
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
  const {dbAdapter} = context

  const startDate = data?.startDate ? new Date(data?.startDate) : new Date()
  const inAWeek = new Date(startDate.getTime() + 7 * ONE_DAY_IN_MILLISECONDS)

  const users = await dbAdapter.user.getUsers({
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

  for (const user of users.nodes) {
    try {
      const {subscription} = user
      if (!subscription || subscription.paidUntil === null) continue // TODO: log warning
      const {periods, paidUntil} = subscription
      periods.sort((periodA, periodB) => {
        if (periodA.endsAt < periodB.endsAt) return -1
        if (periodA.endsAt > periodB.endsAt) return 1
        return 0
      })
      const lastPeriod = periods[periods.length - 1]
      if (lastPeriod.endsAt <= paidUntil) {
        // TODO create new Period
        const startDate = new Date(paidUntil?.getTime() + 1 * ONE_DAY_IN_MILLISECONDS)
        const nextDate = getNextDateForPeriodicity(startDate, subscription.paymentPeriodicity)
        const amount = calculateAmountForPeriodicity(
          subscription.monthlyAmount,
          subscription.paymentPeriodicity
        )

        /* const newInvoice = await dbAdapter.invoice.createInvoice({
          input: {
            userID: user.id,
            description: `Membership from ${startDate.toISOString()} for ${user.name || user.email}`,
            mail: user.email,
            items: [{
              createdAt: new Date(),
              modifiedAt: new Date(),
              name: 'Membership',
              description: `From ${startDate.toISOString()} to ${nextDate.toISOString()}`,
              amount,
              quantity: 1,
            }],
            paidAt: null,
            canceledAt: null,
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
        }) */

        console.log(`
          Create new Period for user ${user.name}
          from: ${startDate.toISOString()}
          to: ${nextDate.toISOString()}
          for: ${amount}
      `)
      }
    } catch (error) {
      console.warn('Error while creating new periods', error)
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
  }
}
