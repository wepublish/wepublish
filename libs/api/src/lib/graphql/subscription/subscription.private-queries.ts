import {PrismaClient} from '@prisma/client'
import {Context} from '../../context'
import {SubscriptionFilter, SubscriptionSort} from '../../db/subscription'
import {unselectPassword} from '@wepublish/user/api'
import {mapSubscriptionsAsCsv} from '../../utility'
import {authorise} from '../permissions'
import {CanGetSubscription, CanGetSubscriptions, CanGetUsers} from '@wepublish/permissions/api'
import {createSubscriptionFilter, getSubscriptions} from './subscription.queries'

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
  subscription: PrismaClient['subscription']
) => {
  const {roles} = authenticate()
  authorise(CanGetSubscriptions, roles)
  authorise(CanGetUsers, roles)

  const subscriptions = await subscription.findMany({
    where: createSubscriptionFilter(filter),
    orderBy: {
      modifiedAt: 'desc'
    },
    include: {
      deactivation: true,
      periods: true,
      properties: true,
      memberPlan: true,
      user: {
        select: unselectPassword
      },
      paymentMethod: true
    }
  })

  return mapSubscriptionsAsCsv(subscriptions)
}
