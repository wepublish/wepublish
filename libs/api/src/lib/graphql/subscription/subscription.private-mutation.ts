import {Context} from '../../context'
import {authorise} from '../permissions'
import {CanCreateSubscription, CanDeleteSubscription} from '@wepublish/permissions/api'
import {Prisma, PrismaClient} from '@prisma/client'
import {unselectPassword} from '@wepublish/user/api'
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
    },
    include: {
      deactivation: true,
      periods: true,
      properties: true
    }
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

  const subscription = await subscriptionClient.create({
    data: {
      ...input,
      properties: {
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

  await memberContext.renewSubscriptionForUser({subscription})

  return subscription
}

type UpdateSubscriptionInput = Prisma.SubscriptionUncheckedUpdateInput & {
  properties: Prisma.MetadataPropertyCreateManySubscriptionInput[]
  deactivation: Prisma.SubscriptionDeactivationCreateWithoutSubscriptionInput | null
}

export const updateAdminSubscription = async (
  id: string,
  {properties, deactivation, ...input}: UpdateSubscriptionInput,
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

  const subscription = await subscriptionClient.findUnique({
    where: {id},
    include: {
      deactivation: true
    }
  })

  const updatedSubscription = await subscriptionClient.update({
    where: {id},
    data: {
      ...input,
      deactivation: deactivation
        ? {
            upsert: {
              create: deactivation,
              update: deactivation
            }
          }
        : {
            delete: Boolean(subscription?.deactivation)
          },
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

  // cancel open invoices if subscription is deactivated
  if (deactivation !== null) {
    await memberContext.cancelInvoicesForSubscription(id)
  }

  return await memberContext.handleSubscriptionChange({
    subscription: updatedSubscription
  })
}
