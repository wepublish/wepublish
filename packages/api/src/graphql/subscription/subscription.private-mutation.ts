import {Context} from '../../context'
import {authorise, CanCreateSubscription, CanDeleteSubscription} from '../permissions'
import {Prisma, PrismaClient} from '@prisma/client'

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
