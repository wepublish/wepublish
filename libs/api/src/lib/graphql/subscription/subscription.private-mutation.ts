import {Context} from '../../context'
import {authorise} from '../permissions'
import {
  CanCancelSubscription,
  CanCreateSubscription,
  CanDeleteSubscription
} from '@wepublish/permissions/api'
import {
  MetadataProperty,
  Prisma,
  PrismaClient,
  Subscription,
  SubscriptionDeactivationReason
} from '@prisma/client'
import {unselectPassword} from '@wepublish/user/api'
import {NotFound, UserSubscriptionAlreadyDeactivated} from '../../error'
import {MemberContext} from '../../memberContext'
import {PaymentProvider} from '@wepublish/payments'

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

export const handleRemoteManagedSubscription = async ({
  paymentProvider,
  input,
  originalSubscription
}: {
  paymentProvider: PaymentProvider
  input: Subscription
  originalSubscription: Subscription & {properties: MetadataProperty[]}
}) => {
  // update amount is possible
  if (input.monthlyAmount !== originalSubscription.monthlyAmount) {
    await paymentProvider.updateRemoteSubscriptionAmount({
      subscription: originalSubscription,
      newAmount: parseInt(`${input.monthlyAmount}`, 10)
    })
  } else if (input.autoRenew === false) {
    await paymentProvider.cancelRemoteSubscription({
      subscription: originalSubscription
    })
  } else {
    throw new Error(
      `It is not possible to update the subscription with payment provider "${paymentProvider.name}".`
    )
  }
}

export const updateAdminSubscription = async (
  id: string,
  {properties, ...input}: UpdateSubscriptionInput,
  authenticate: Context['authenticate'],
  memberContext: Context['memberContext'],
  subscriptionClient: PrismaClient['subscription'],
  userClient: PrismaClient['user'],
  paymentProviders: PaymentProvider[]
) => {
  const {roles} = authenticate()
  authorise(CanCreateSubscription, roles)

  const originalSubscription = await subscriptionClient.findUnique({
    where: {
      id: id
    },
    include: {
      properties: true
    }
  })
  // handle Payrexx Subscription Provider
  const paymentProvider = paymentProviders.find(
    pp => pp.id === originalSubscription.paymentMethodID
  )
  if (paymentProvider.remoteManagedSubscription) {
    await handleRemoteManagedSubscription({
      paymentProvider,
      input: input as Subscription,
      originalSubscription
    })
  }

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
