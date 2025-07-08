import {Injectable} from '@nestjs/common'
import {
  MemberPlan,
  MetadataProperty,
  PaymentPeriodicity,
  Prisma,
  PrismaClient,
  Subscription,
  SubscriptionDeactivation,
  SubscriptionDeactivationReason,
  SubscriptionPeriod
} from '@prisma/client'
import {
  InternalError,
  MonthlyAmountNotEnough,
  NotFound,
  PaymentConfigurationNotAllowed,
  SubscriptionToDeactivateDoesNotExist
} from '@wepublish/api'
import {RemoteSubscriptionsService} from './remote-subscriptions.service'
import {UserInputError} from '@nestjs/apollo'
import {MemberPlanService} from '@wepublish/member-plan/api'
import {
  CreateSubscriptionArgs,
  CreateSubscriptionWithConfirmationArgs,
  ExtendSubscriptionArgs
} from './subscription.model'
import {PaymentMethodService} from '@wepublish/payment-method/api'
import {MemberContextService} from './member-context.service'
import {PaymentsService} from '@wepublish/payment/api'
import {logger} from '@wepublish/utils/api'
import {unselectPassword} from '@wepublish/authentication/api'

export type SubscriptionWithRelations = Subscription & {
  periods: SubscriptionPeriod[]
  properties: MetadataProperty[]
  deactivation: SubscriptionDeactivation | null
}

@Injectable()
export class UserSubscriptionService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly payments: PaymentsService,
    private readonly memberPlanService: MemberPlanService,
    private readonly paymentMethodService: PaymentMethodService,
    private readonly remoteSubscriptionsService: RemoteSubscriptionsService,
    private readonly memberContext: MemberContextService
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

  async createSubscription(userId: string, args: CreateSubscriptionArgs) {
    const {memberPlan, paymentMethod} = await this.validateSubscriptionInput(args)

    const {
      autoRenew,
      paymentPeriodicity,
      monthlyAmount,
      subscriptionProperties,
      successURL,
      failureURL,
      deactivateSubscriptionId
    } = args

    // Check if subscription which should be deactivated exists
    let subscriptionToDeactivate: null | Subscription = null
    if (deactivateSubscriptionId) {
      subscriptionToDeactivate = await this.prisma.subscription.findUnique({
        where: {
          id: deactivateSubscriptionId,
          userID: userId,
          deactivation: {
            is: null
          }
        },
        include: {
          deactivation: true,
          periods: true,
          properties: true
        }
      })
      if (!subscriptionToDeactivate)
        throw new SubscriptionToDeactivateDoesNotExist(deactivateSubscriptionId)
    }

    const properties = await this.memberContext.processSubscriptionProperties(
      subscriptionProperties ?? []
    )

    const {subscription, invoice} = await this.memberContext.createSubscription(
      userId,
      paymentMethod.id,
      paymentPeriodicity,
      monthlyAmount,
      memberPlan.id,
      properties,
      autoRenew,
      memberPlan.extendable,
      subscriptionToDeactivate
    )

    if (!invoice) {
      logger('mutation.public').error(
        'Could not create new invoice for subscription with ID "%s"',
        subscription.id
      )
      throw new InternalError()
    }

    if (subscriptionToDeactivate) {
      await this.memberContext.deactivateSubscription({
        subscription: subscriptionToDeactivate,
        deactivationReason: SubscriptionDeactivationReason.userReplacedSubscription
      })
    }

    return await this.payments.createPaymentWithProvider({
      invoice,
      saveCustomer: true,
      paymentMethodID: paymentMethod.id,
      successURL,
      failureURL,
      userId
    })
  }

  async createSubscriptionWithConfirmation(
    userId: string,
    args: Omit<CreateSubscriptionWithConfirmationArgs, 'userId'>
  ) {
    try {
      const {memberPlan, paymentMethod} = await this.validateSubscriptionInput(args)

      const {autoRenew, paymentPeriodicity, monthlyAmount, subscriptionProperties} = args

      const properties = await this.memberContext.processSubscriptionProperties(
        subscriptionProperties ?? []
      )

      const {subscription, invoice} = await this.memberContext.createSubscription(
        userId,
        paymentMethod.id,
        paymentPeriodicity,
        monthlyAmount,
        memberPlan.id,
        properties,
        autoRenew,
        memberPlan.extendable,
        undefined,
        undefined,
        true
      )

      if (!invoice) {
        logger('mutation.public').error(
          'Could not create new invoice for subscription with ID "%s"',
          subscription.id
        )
        throw new InternalError()
      }

      return true
    } catch (e: any) {
      console.log(e.stack)
      throw e
    }
  }

  async extendSubscription(userId: string, args: ExtendSubscriptionArgs) {
    const {subscriptionId, successURL, failureURL} = args

    const subscription = (await this.prisma.subscription.findUnique({
      where: {
        id: subscriptionId
      },
      include: {
        memberPlan: true
      }
    })) as SubscriptionWithRelations & {memberPlan: MemberPlan}

    // Allow only valid and subscription belonging to the user to early extend
    if (!subscription || subscription.userID !== userId) {
      logger('extendSubscription').error(
        'Could not find subscription with ID "%s" or subscription does not belong to user "%s"',
        subscriptionId,
        userId
      )
      throw new UserInputError(`SubscriptionId given not found!`)
    }

    // Prevent user from extending not extendable subscription
    if (!subscription.extendable) {
      throw new UserInputError(`Subscription with id ${subscription.id} is not extendable!`)
    }

    // Throw for unsupported payment providers
    const paymentMethod = await this.prisma.paymentMethod.findUnique({
      where: {
        id: subscription.paymentMethodID
      }
    })
    if (!paymentMethod) {
      logger('extendSubscription').error(
        'Could not find paymentMethod with ID "%s"',
        subscription.paymentMethodID
      )
      throw new InternalError()
    }

    const paymentProvider = this.payments.paymentProviders.find(
      obj => obj.id === paymentMethod.paymentProviderID
    )

    // Prevent user from creating new invoice while having unpaid invoices
    const unpaidInvoices = await this.prisma.invoice.findMany({
      where: {
        subscriptionID: subscription.id,
        paidAt: null
      }
    })
    if (unpaidInvoices.length > 0) {
      throw new UserInputError(`You cant create new invoice while you have unpaid invoices!`)
    }

    const invoice = await this.memberContext.renewSubscriptionForUser({
      subscription
    })
    if (!invoice) {
      logger('extendSubscription').error(
        'Could not create new invoice for subscription with ID "%s"',
        subscription.id
      )
      throw new InternalError()
    }

    // If payment provider supports off session payment try to charge
    if (!paymentProvider || paymentProvider.offSessionPayments) {
      const paymentMethod = await this.paymentMethodService.findActivePaymentMethodById(
        subscription.paymentMethodID
      )
      if (!paymentMethod) {
        logger('extendSubscription').warn(
          'paymentMethod %s not found',
          subscription.paymentMethodID
        )
        throw new InternalError()
      }

      const fullUser = await this.prisma.user.findUnique({
        where: {id: subscription.userID},
        select: unselectPassword
      })
      if (!fullUser) {
        logger('extendSubscription').warn('user %s not found', subscription.userID)
        throw new InternalError()
      }

      const customer = fullUser.paymentProviderCustomers.find(
        ppc => ppc.paymentProviderID === paymentMethod.paymentProviderID
      )
      if (!customer) {
        logger('extendSubscription').warn('customer %s not found', paymentMethod.paymentProviderID)
      } else {
        const user = await this.prisma.user.findUniqueOrThrow({where: {id: userId}})
        // Charge customer
        try {
          const payment = await this.memberContext.chargeInvoice({
            user,
            invoice,
            paymentMethodID: subscription.paymentMethodID,
            customer
          })
          if (payment) {
            return payment
          }
        } catch (e) {
          logger('extendSubscription').warn(
            'Invoice off session charge for subscription %s failed: %s',
            subscription.id,
            e
          )
        }
      }
    }
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
      !memberPlan.availablePaymentMethods.some((apm: any) => {
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

    return await this.memberContext.handleSubscriptionChange({
      subscription: updateSubscription
    })
  }

  async cancelUserSubscription(userId: string, subscriptionId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: {
        id: subscriptionId,
        userID: userId
      },
      include: {
        deactivation: true,
        periods: true,
        properties: true
      }
    })

    if (!subscription) {
      throw new UserInputError(`Subscription not found ${subscriptionId}`)
    }

    if (subscription.deactivation) {
      const msg =
        subscription.deactivation.date < new Date()
          ? 'Subscription is already canceled'
          : 'Subscription is already marked to be canceled'
      throw new UserInputError(msg)
    }

    await this.memberContext.deactivateSubscription({
      subscription,
      deactivationReason: SubscriptionDeactivationReason.userSelfDeactivated
    })

    const updatedSubscription = await this.prisma.subscription.findUnique({
      where: {id: subscriptionId},
      include: {
        deactivation: true,
        periods: true,
        properties: true
      }
    })

    if (!updatedSubscription) {
      throw new UserInputError(`Subscription not found ${subscriptionId}`)
    }

    return updatedSubscription
  }

  private async validateSubscriptionInput({
    memberPlanID,
    memberPlanSlug,
    autoRenew,
    paymentPeriodicity,
    monthlyAmount,
    paymentMethodID,
    paymentMethodSlug
  }: Omit<
    CreateSubscriptionArgs,
    'subscriptionProperties' | 'successURL' | 'failureURL' | 'deactivateSubscriptionId'
  >) {
    await this.memberContext.validateInputParamsCreateSubscription(
      memberPlanID,
      memberPlanSlug,
      paymentMethodID,
      paymentMethodSlug
    )

    const memberPlan = memberPlanID
      ? await this.memberPlanService.getMemberPlanById(memberPlanID)
      : await this.memberPlanService.getMemberPlanBySlug(memberPlanSlug ?? '')
    if (!memberPlan) {
      throw new UserInputError(`MemberPlan not found ${memberPlanID || memberPlanSlug}`)
    }

    const paymentMethod = paymentMethodID
      ? await this.paymentMethodService.findActivePaymentMethodById(paymentMethodID)
      : await this.paymentMethodService.findActivePaymentMethodBySlug(paymentMethodSlug ?? '')

    if (!paymentMethod) {
      throw new UserInputError(`PaymentMethod not found ${paymentMethodID || paymentMethodSlug}`)
    }

    if (monthlyAmount < memberPlan.amountPerMonthMin) {
      throw new UserInputError(`Monthly amount not enough`)
    }

    await this.memberContext.validateSubscriptionPaymentConfiguration(
      memberPlan,
      autoRenew,
      paymentPeriodicity,
      paymentMethod
    )

    return {
      memberPlan,
      paymentMethod
    }
  }
}
