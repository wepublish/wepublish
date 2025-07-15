import {Parent, ResolveField, Resolver} from '@nestjs/graphql'
import {add} from 'date-fns'
import {PublicSubscription, SubscriptionDeactivation} from './subscription.model'
import {PrismaClient, Subscription} from '@prisma/client'
import {URLAdapter} from '@wepublish/nest-modules'
import {MemberPlan, MemberPlanDataloader} from '@wepublish/member-plan/api'
import {PaymentMethod, PaymentMethodDataloader} from '@wepublish/payment-method/api'
import {Property} from '@wepublish/utils/api'
import {SubscriptionDeactivationDataloader} from './subscription-deactivation.dataloader'
import {SubscriptionPropertyDataloader} from './subscription-properties.dataloader'

@Resolver(() => PublicSubscription)
export class PublicSubscriptionResolver {
  constructor(
    private urlAdapter: URLAdapter,
    private prisma: PrismaClient,
    private paymentMethodDataloader: PaymentMethodDataloader,
    private deactivationDataloader: SubscriptionDeactivationDataloader,
    private propertyDataloader: SubscriptionPropertyDataloader,
    private memberPlanDataloader: MemberPlanDataloader
  ) {}

  @ResolveField(() => SubscriptionDeactivation)
  async deactivation(@Parent() subscription: Subscription) {
    return this.deactivationDataloader.load(subscription.id)
  }

  @ResolveField(() => MemberPlan)
  async memberPlan(@Parent() subscription: Subscription) {
    return this.memberPlanDataloader.load(subscription.memberPlanID)
  }

  @ResolveField(() => PaymentMethod)
  async paymentMethod(@Parent() subscription: Subscription) {
    return this.paymentMethodDataloader.load(subscription.paymentMethodID)
  }

  @ResolveField(() => [Property])
  async properties(@Parent() subscription: Subscription) {
    const properties = (await this.propertyDataloader.load(subscription.id)) ?? []

    return properties.filter(p => p.public)
  }

  @ResolveField(() => String)
  async url(@Parent() subscription: Subscription) {
    return this.urlAdapter.getSubscriptionURL(subscription)
  }

  @ResolveField(() => Boolean)
  async canExtend(@Parent() subscription: Subscription) {
    const [deactivation, paymentMethod, unpaidAndUncanceledInvoice] = await Promise.all([
      this.deactivationDataloader.load(subscription.id),
      this.paymentMethodDataloader.load(subscription.paymentMethodID),
      this.prisma.invoice.findFirst({
        where: {
          subscription: {
            userID: subscription.userID
          },
          paidAt: null,
          canceledAt: null
        }
      })
    ])

    /**
     * Can only extend when:
     *   Subscription is extendable
     *   Subscription is not deactivated
     *   Subscription is about to run out (less than 1 month)
     *   All invoices have been paid (or cancelled)
     *   Not using a deprecated payment method
     */
    return !!(
      subscription.paidUntil &&
      subscription.extendable &&
      !deactivation &&
      +add(new Date(), {months: 1}) > +subscription.paidUntil &&
      !unpaidAndUncanceledInvoice &&
      // @TODO: Remove when all 'payrexx subscriptions' subscriptions have been migrated
      paymentMethod?.slug !== 'payrexx-subscription'
    )
  }
}
