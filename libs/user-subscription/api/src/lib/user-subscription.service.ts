import {Injectable} from '@nestjs/common'
import {PaymentPeriodicity, Prisma, PrismaClient, Subscription} from '@prisma/client'
import {
  MailContext,
  MonthlyAmountNotEnough,
  NotFound,
  PaymentConfigurationNotAllowed,
  PaymentsService
} from '@wepublish/api'
import {MemberPlanService} from '@wepublish/member-plan/api'
import {RemoteSubscriptionsService} from './remote-subscriptions.service'
import {MemberContext} from 'libs/api/src/lib/memberContext'

@Injectable()
export class UserSubscriptionService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly payments: PaymentsService,
    private readonly memberPlanService: MemberPlanService,
    private readonly remoteSubscriptionsService: RemoteSubscriptionsService,
    private readonly mailContext: MailContext
  ) {}

  public async getUserSubscriptions(userId: string) {
    return this.prisma.subscription.findMany({
      where: {
        userID: userId
      },
      select: {
        id: true
      }
    })
  }

  async updatePublicSubscription(
    id: string,
    input: Pick<
      Prisma.SubscriptionUncheckedUpdateInput,
      | 'memberPlanID'
      | 'paymentPeriodicity'
      | 'monthlyAmount'
      | 'autoRenew'
      | 'paymentMethodID'
      | 'userID'
    >
  ) {
    const subscription = await this.prisma.subscription.findUnique({
      where: {id},
      include: {
        properties: true,
        deactivation: true
      }
    })

    if (!subscription) throw new NotFound('subscription', id)

    const {memberPlanID, paymentPeriodicity, monthlyAmount, autoRenew, paymentMethodID, userID} =
      input

    const memberPlan = await this.memberPlanService.getMemberPlanById(memberPlanID as string)
    if (!memberPlan) {
      throw new NotFound('MemberPlan', memberPlanID as string)
    }

    const paymentMethod = await this.prisma.paymentMethod.findUnique({
      where: {id: paymentMethodID as string, active: true}
    })
    if (!paymentMethod) {
      throw new NotFound('PaymentMethod', paymentMethodID as string)
    }

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
    const paymentMethodRemote = await this.prisma.paymentMethod.findUnique({
      where: {id: subscription.paymentMethodID as string, active: true}
    })
    const paymentProvider = this.payments
      .getProviders()
      .find(paymentProvider => paymentProvider.id === paymentMethodRemote?.paymentProviderID)
    if (paymentProvider?.remoteManagedSubscription) {
      await this.remoteSubscriptionsService.updateSubscription({
        paymentProvider,
        originalSubscription: subscription,
        input: input as Subscription
      })
    }

    const updateSubscription = await this.prisma.subscription.update({
      where: {id},
      data: {
        userID: subscription.userID ?? userID,
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

    const memberContext = new MemberContext({
      prisma: this.prisma,
      mailContext: this.mailContext,
      paymentProviders: this.payments.getProviders()
    })

    return await memberContext.handleSubscriptionChange({
      subscription: updateSubscription
    })
  }
}
