import {PrismaClient} from '@prisma/client'
import {Context} from '../../context'
import {ConnectionResult, SortOrder} from '../../db/common'
import {
  SubscriptionFilter,
  SubscriptionSort,
  SubscriptionWithRelations
} from '../../db/subscription'
import {UserSort, UserWithRelations} from '../../db/user'
import {mapSubscriptionsAsCsv} from '../../utility'
import {authorise, CanGetSubscription, CanGetSubscriptions, CanGetUsers} from '../permissions'
import {getUsers} from '../user/user.queries'
import {getSubscriptions} from './subscription.queries'

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
    },
    include: {
      deactivation: true,
      periods: true,
      properties: true
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

  const subscriptions: SubscriptionWithRelations[] = []
  const users: UserWithRelations[] = []

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
    )) as ConnectionResult<SubscriptionWithRelations> // SEE: https://github.com/microsoft/TypeScript/issues/36687
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
    )) as ConnectionResult<UserWithRelations> // SEE: https://github.com/microsoft/TypeScript/issues/36687
    users.push(...listResult.nodes)
    hasMore = listResult.pageInfo.hasNextPage
    afterCursor = listResult.pageInfo.endCursor
  }

  return mapSubscriptionsAsCsv(users, subscriptions)
}
