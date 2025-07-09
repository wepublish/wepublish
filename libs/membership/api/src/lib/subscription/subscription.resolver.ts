import {Parent, ResolveField, Resolver} from '@nestjs/graphql'
import {add} from 'date-fns'
import {PublicSubscription} from './subscription.model'
import {PrismaClient, Subscription} from '@prisma/client'
import {URLAdapter} from '@wepublish/nest-modules'
import {MemberPlan, MemberPlanService} from '@wepublish/member-plan/api'
import {PaymentMethod, PaymentMethodDataloader} from '@wepublish/payment-method/api'
import {Property} from '@wepublish/utils/api'

@Resolver(() => PublicSubscription)
export class PublicSubscriptionResolver {
  constructor(
    private urlAdapter: URLAdapter,
    private prisma: PrismaClient,
    private memberPlanService: MemberPlanService,
    private paymentMethodDataloader: PaymentMethodDataloader
  ) {}

  @ResolveField(() => MemberPlan)
  async memberPlan(@Parent() subscription: PublicSubscription) {
    return this.memberPlanService.getMemberPlanById(subscription.memberPlanID)
  }

  @ResolveField(() => PaymentMethod)
  async paymentMethod(@Parent() subscription: PublicSubscription) {
    return this.paymentMethodDataloader.load(subscription.paymentMethodID)
  }

  @ResolveField(() => [Property])
  properties(@Parent() subscription: any) {
    return subscription.properties.filter((p: any) => p.public)
  }

  @ResolveField(() => String)
  async url(@Parent() subscription: Subscription) {
    return this.urlAdapter.getSubscriptionURL(subscription)
  }

  @ResolveField(() => Boolean)
  async canExtend(@Parent() subscription: Subscription) {
    const [paymentMethod, unpaidAndUncanceledInvoice] = await Promise.all([
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
      !subscription.deactivation &&
      +add(new Date(), {months: 1}) > +subscription.paidUntil &&
      !unpaidAndUncanceledInvoice &&
      // @TODO: Remove when all 'payrexx subscriptions' subscriptions have been migrated
      paymentMethod?.slug !== 'payrexx-subscription'
    )
  }
}
