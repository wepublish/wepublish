import {Context} from '../../context'
import {authorise, CanCreateSubscription, CanDeleteSubscription} from '../permissions'
import {Prisma, PrismaClient} from '@prisma/client'
import {unselectPassword} from '../../db/user'
import {NotFound} from '../../error'

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
    }
  })
}

export const createSubscription = async (
  input: Omit<Prisma.SubscriptionUncheckedCreateInput, 'modifiedAt'>,
  authenticate: Context['authenticate'],
  memberContext: Context['memberContext'],
  subscriptionClient: PrismaClient['subscription']
) => {
  const {roles} = authenticate()
  authorise(CanCreateSubscription, roles)

  const subscription = await subscriptionClient.create({
    data: {...input, modifiedAt: new Date()}
  })

  await memberContext.renewSubscriptionForUser({subscription: subscription})

  return subscription
}

export const updateAdminSubscription = async (
  id: string,
  input: Omit<Prisma.SubscriptionUncheckedUpdateInput, 'createdAt' | 'modifiedAt'>,
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

  const updatedSubscription = await subscriptionClient.update({where: {id}, data: input})
  if (!updatedSubscription) throw new NotFound('subscription', id)

  return await memberContext.handleSubscriptionChange({
    subscription: updatedSubscription
  })
}
