import {Context} from '../../context'
import {authorise, CanGetSubscription, CanGetSubscriptions, CanGetUsers} from '../permissions'
import {PrismaClient, Subscription, User} from '@prisma/client'
import {SubscriptionFilter, SubscriptionSort} from '../../db/subscription'
import {getSubscriptions} from './subscription.queries'
import {ConnectionResult, SortOrder} from '../../db/common'
import {UserSort} from '../../db/user'
import {getUsers} from '../user/user.queries'
import {mapSubscriptionsAsCsv} from '../../utility'

export const getSubscriptionById = (
  id: string,
  authenticate: Context['authenticate'],
  subscription: PrismaClient['subscription']
) => {
  const {roles} = authenticate()
  authorise(CanGetSubscription, roles)

  return subscription.findUnique({
    where: {
      id
    }
  })
}

export const getAdminSubscriptions = (
  filter: Partial<SubscriptionFilter>,
  sortedField: SubscriptionSort,
  order: 1 | -1,
  cursorId: string | null,
  skip: number,
  take: number,
  authenticate: Context['authenticate'],
  subscription: PrismaClient['subscription']
) => {
  const {roles} = authenticate()
  authorise(CanGetSubscriptions, roles)

  return getSubscriptions(filter, sortedField, order, cursorId, skip, take, subscription)
}

export const getSubscriptionsAsCSV = async (
  filter: SubscriptionFilter,
  authenticate: Context['authenticate'],
  subscription: PrismaClient['subscription'],
  user: PrismaClient['user']
) => {
  const {roles} = authenticate()
  authorise(CanGetSubscriptions, roles)
  authorise(CanGetUsers, roles)

  const subscriptions: Subscription[] = []
  const users: User[] = []

  let hasMore = true
  let afterCursor: string | null = null
  while (hasMore) {
    const listResult = (await getSubscriptions(
      filter,
      SubscriptionSort.ModifiedAt,
      SortOrder.Descending,
      afterCursor,
      afterCursor ? 1 : 0,
      100,
      subscription
    )) as ConnectionResult<Subscription> // SEE: https://github.com/microsoft/TypeScript/issues/36687
    subscriptions.push(...listResult.nodes)
    hasMore = listResult.pageInfo.hasNextPage
    afterCursor = listResult.pageInfo.endCursor
  }

  hasMore = true
  afterCursor = null

  while (hasMore) {
    const listResult = (await getUsers(
      {},
      UserSort.ModifiedAt,
      SortOrder.Descending,
      afterCursor,
      afterCursor ? 1 : 0,
      100,
      user
    )) as ConnectionResult<User> // SEE: https://github.com/microsoft/TypeScript/issues/36687
    users.push(...listResult.nodes)
    hasMore = listResult.pageInfo.hasNextPage
    afterCursor = listResult.pageInfo.endCursor
  }

  return mapSubscriptionsAsCsv(users, subscriptions)
}
