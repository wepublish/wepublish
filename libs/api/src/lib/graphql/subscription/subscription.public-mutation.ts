import {Context} from '../../context'
import {PaymentPeriodicity, Prisma, PrismaClient, Subscription} from '@prisma/client'
import {MonthlyAmountNotEnough, NotFound, PaymentConfigurationNotAllowed} from '../../error'
import {PaymentProvider} from '@wepublish/payment/api'
import {handleRemoteManagedSubscription} from './subscription.private-mutation'

export const updatePublicSubscription = async (
  id: string,
  input: Pick<
    Prisma.SubscriptionUncheckedUpdateInput,
    'memberPlanID' | 'paymentPeriodicity' | 'monthlyAmount' | 'autoRenew' | 'paymentMethodID'
  >,
  authenticateUser: Context['authenticateUser'],
  memberContext: Context['memberContext'],
  activeMemberPlansByID: Context['loaders']['activeMemberPlansByID'],
  activePaymentMethodsByID: Context['loaders']['activePaymentMethodsByID'],
  subscriptionClient: PrismaClient['subscription'],
  paymentProviders: PaymentProvider[]
) => {
  const {user} = authenticateUser()

  const subscription = await subscriptionClient.findUnique({
    where: {id},
    include: {
      properties: true,
      deactivation: true
    }
  })

  if (!subscription) throw new NotFound('subscription', id)

  const {memberPlanID, paymentPeriodicity, monthlyAmount, autoRenew, paymentMethodID} = input

  const memberPlan = await activeMemberPlansByID.load(memberPlanID as string)
  if (!memberPlan) throw new NotFound('MemberPlan', memberPlanID as string)

  const paymentMethod = await activePaymentMethodsByID.load(paymentMethodID as string)
  if (!paymentMethod) throw new NotFound('PaymentMethod', paymentMethodID as string)

  if (!monthlyAmount || (monthlyAmount as number) < memberPlan.amountPerMonthMin)
    throw new MonthlyAmountNotEnough()

  if (subscription.deactivation) {
    throw new Error('You are not allowed to change a deactivated subscription!')
  }

  if (!subscription.extendable && autoRenew) {
    throw new Error("You can't make a non extendable subscription autoRenew!")
  }

  if (
    !memberPlan.availablePaymentMethods.some(apm => {
      if (apm.forceAutoRenewal && !autoRenew) {
        return false
      }

      return (
        apm.paymentPeriodicities.includes(paymentPeriodicity as PaymentPeriodicity) &&
        apm.paymentMethodIDs.includes(paymentMethodID as string)
      )
    })
  ) {
    throw new PaymentConfigurationNotAllowed()
  }

  // handle remote managed subscriptions (Payrexx Subscription)
  const {paymentProviderID} = await memberContext.getPaymentMethodByIDOrSlug(
    memberContext.loaders,
    undefined,
    subscription.paymentMethodID
  )
  const paymentProvider = paymentProviders.find(
    paymentProvider => paymentProvider.id === paymentProviderID
  )
  if (paymentProvider?.remoteManagedSubscription) {
    await handleRemoteManagedSubscription({
      paymentProvider,
      originalSubscription: subscription,
      input: input as Subscription
    })
  }

  const updateSubscription = await subscriptionClient.update({
    where: {id},
    data: {
      userID: subscription.userID ?? user.id,
      memberPlanID,
      paymentPeriodicity,
      monthlyAmount,
      autoRenew,
      paymentMethodID
    },
    include: {
      deactivation: true,
      periods: true,
      properties: true
    }
  })

  if (!updateSubscription) throw new Error('Error during updateSubscription')

  return await memberContext.handleSubscriptionChange({
    subscription: updateSubscription
  })
}
