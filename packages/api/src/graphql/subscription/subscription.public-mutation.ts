import {Context} from '../../context'
import {PaymentPeriodicity, Prisma, PrismaClient} from '@prisma/client'
import {MonthlyAmountNotEnough, NotFound, PaymentConfigurationNotAllowed} from '../../error'

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
  subscriptionClient: PrismaClient['subscription']
) => {
  const {user} = authenticateUser()

  const subscription = await subscriptionClient.findUnique({
    where: {id}
  })

  if (!subscription) throw new NotFound('subscription', id)

  const {memberPlanID, paymentPeriodicity, monthlyAmount, autoRenew, paymentMethodID} = input

  const memberPlan = await activeMemberPlansByID.load(memberPlanID as string)
  if (!memberPlan) throw new NotFound('MemberPlan', memberPlanID as string)

  const paymentMethod = await activePaymentMethodsByID.load(paymentMethodID as string)
  if (!paymentMethod) throw new NotFound('PaymentMethod', paymentMethodID as string)

  if (!monthlyAmount || monthlyAmount < memberPlan.amountPerMonthMin)
    throw new MonthlyAmountNotEnough()

  if (
    !memberPlan.availablePaymentMethods.some(apm => {
      if (apm.forceAutoRenewal && !autoRenew) return false
      return (
        apm.paymentPeriodicities.includes(paymentPeriodicity as PaymentPeriodicity) &&
        apm.paymentMethodIDs.includes(paymentMethodID as string)
      )
    })
  ) {
    throw new PaymentConfigurationNotAllowed()
  }

  const updateSubscription = await subscriptionClient.update({
    where: {id},
    data: {
      userID: subscription.userID ?? user.id,
      memberPlanID,
      paymentPeriodicity,
      monthlyAmount,
      autoRenew,
      paymentMethodID,
      deactivation: null
    }
  })

  if (!updateSubscription) throw new Error('Error during updateSubscription')

  return await memberContext.handleSubscriptionChange({
    subscription: updateSubscription
  })
}
