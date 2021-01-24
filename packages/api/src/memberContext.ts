import {UserSort, UserSubscription} from './db/user'
import {OptionalInvoice} from './db/invoice'
import {DBAdapter} from './db/adapter'
import {logger} from './server'
import {DataLoaderContext} from './context'
import {ONE_DAY_IN_MILLISECONDS} from './utility'
import {PaymentPeriodicity} from './db/memberPlan'
import {DateFilterComparison, InputCursor, LimitType, SortOrder} from './db/common'

export interface renewSubscriptionForUserProps {
  userID: string
  userEmail: string
  userName: string
  userSubscription: UserSubscription
}

export interface renewSubscriptionForUsersProps {
  startDate?: Date // defaults to today
  daysToLookAhead: number
}

export interface MemberContext {
  dbAdapter: DBAdapter
  loaders: DataLoaderContext
  renewSubscriptionForUser(props: renewSubscriptionForUserProps): Promise<OptionalInvoice>
  renewSubscriptionForUsers(props: renewSubscriptionForUsersProps): Promise<void>
}

export interface MemberContextProps {
  readonly dbAdapter: DBAdapter
  readonly loaders: DataLoaderContext
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

export class MemberContext implements MemberContext {
  dbAdapter: DBAdapter
  loaders: DataLoaderContext

  constructor(props: MemberContextProps) {
    this.dbAdapter = props.dbAdapter
    this.loaders = props.loaders
  }

  async renewSubscriptionForUser({
    userID,
    userEmail,
    userName,
    userSubscription
  }: renewSubscriptionForUserProps): Promise<OptionalInvoice> {
    try {
      const {periods = [], paidUntil} = userSubscription
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
      // TODO: implement check if paidUntil is super long time ago
      const startDate = new Date(
        paidUntil ? paidUntil.getTime() + 1 * ONE_DAY_IN_MILLISECONDS : new Date().getTime()
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
      return newInvoice
    } catch (error) {
      logger('memberContext').error(error, 'Error while renewing subscription for user %s', userID)
    }
    return null
  }

  async renewSubscriptionForUsers({
    startDate = new Date(),
    daysToLookAhead
  }: renewSubscriptionForUsersProps): Promise<void> {
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
}
