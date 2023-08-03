import {Context} from '../../context'
import {authorise} from '../permissions'
import {
  CanCancelSubscription,
  CanCreateSubscription,
  CanDeleteSubscription
} from '@wepublish/permissions/api'
import {Prisma, PrismaClient, SubscriptionDeactivationReason} from '@prisma/client'
import {unselectPassword} from '@wepublish/user/api'
import {MonthlyAmountNotEnough, NotFound, UserSubscriptionAlreadyDeactivated} from '../../error'
import {MemberContext} from '../../memberContext'

export const deleteSubscriptionById = (
  id: string,
  authenticate: Context['authenticate'],
  subscription: PrismaClient['subscription']
) => {
  const {roles} = authenticate()
  authorise(CanDeleteSubscription, roles)

  return subscription.delete({
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

export const cancelSubscriptionById = async (
  id: string,
  reason: SubscriptionDeactivationReason,
  authenticate: Context['authenticate'],
  subscriptionDB: PrismaClient['subscription'],
  memberContext: MemberContext
) => {
  const {roles} = authenticate()
  authorise(CanCancelSubscription, roles)

  const subscription = await subscriptionDB.findUnique({
    where: {id},
    include: {
      deactivation: true,
      periods: true,
      properties: true
    }
  })

  if (!subscription) throw new NotFound('subscription', id)

  if (subscription.deactivation)
    throw new UserSubscriptionAlreadyDeactivated(subscription.deactivation.date)

  return await memberContext.deactivateSubscription({
    subscription,
    deactivationReason: reason
  })
}

type CreateSubscriptionInput = Prisma.SubscriptionCreateInput & {
  properties: Prisma.MetadataPropertyCreateManySubscriptionInput[]
}

export const createSubscription = async (
  {properties, ...input}: CreateSubscriptionInput,
  authenticate: Context['authenticate'],
  memberContext: Context['memberContext'],
  subscriptionClient: PrismaClient['subscription']
) => {
  const {roles} = authenticate()
  authorise(CanCreateSubscription, roles)

  const {subscription} = await memberContext.createSubscription(
    subscriptionClient,
    input['userID'],
    input['paymentMethodID'],
    input['paymentPeriodicity'],
    input['monthlyAmount'],
    input['memberPlanID'],
    properties,
    input['autoRenew'],
    input['startsAt']
  )

  return subscription
}

type UpdateSubscriptionInput = Prisma.SubscriptionUncheckedUpdateInput & {
  properties: Prisma.MetadataPropertyCreateManySubscriptionInput[]
  deactivation: Prisma.SubscriptionDeactivationCreateWithoutSubscriptionInput | null
}

export const updateAdminSubscription = async (
  id: string,
  {properties, ...input}: UpdateSubscriptionInput,
  authenticate: Context['authenticate'],
  memberContext: Context['memberContext'],
  subscriptionClient: PrismaClient['subscription'],
  userClient: PrismaClient['user']
) => {
  const {roles} = authenticate()
  authorise(CanCreateSubscription, roles)

  const user = await userClient.findUnique({
    where: {
      id: input.userID as string
    },
    select: unselectPassword
  })

  if (!user) throw new Error('Can not update subscription without user')

  const updatedSubscription = await subscriptionClient.update({
    where: {id},
    data: {
      ...input,
      properties: {
        deleteMany: {
          subscriptionId: id
        },
        createMany: {
          data: properties
        }
      }
    },
    include: {
      deactivation: true,
      periods: true,
      properties: true
    }
  })

  if (!updatedSubscription) throw new NotFound('subscription', id)

  return await memberContext.handleSubscriptionChange({
    subscription: updatedSubscription
  })
}
