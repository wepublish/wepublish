import {Injectable} from '@nestjs/common'
import {SubscriptionFlow} from '@prisma/client'
import {PrismaService} from '@wepublish/nest-modules'
import {PaymentMethodRef} from './subscription-flow.model'

interface SubscriptionFlowWithSubscriptionCount {
  subscriptionFlowId: number
  subscriptionCount: number
}

export type SubscriptionFlowWithPaymentMethod = SubscriptionFlow & {
  paymentMethods: PaymentMethodRef[]
}

@Injectable()
export class SubscriptionFlowHelper {
  constructor(private prismaService: PrismaService) {}

  /**
   * Compute the number of affected subscriptions for a collection of subscription flows.
   * The map { 1: 248, 2: 483 } means that flow 1 affects 248, and flow 2 affects 483 subscriptions.
   * @param subscriptionsFlows The subscription flows to calculate the count for
   * @returns a hashmap of the flow id and the number of subscriptions
   */
  async numberOfSubscriptionsFor(
    subscriptionsFlows: SubscriptionFlowWithPaymentMethod[]
  ): Promise<SubscriptionFlowWithSubscriptionCount[]> {
    const subscriptionCount = await this.prismaService.subscription.groupBy({
      by: ['memberPlanID', 'paymentPeriodicity', 'autoRenew', 'paymentMethodID'],
      _count: true
    })

    return subscriptionsFlows.map(f => {
      const matches = subscriptionCount.filter(
        sc =>
          sc.memberPlanID === f.memberPlanId &&
          f.periodicities.includes(sc.paymentPeriodicity) &&
          f.autoRenewal.includes(sc.autoRenew) &&
          f.paymentMethods.map(pm => pm.id).includes(sc.paymentMethodID)
      )

      let count = matches.reduce((acc, item) => acc + item._count, 0)

      if (f.default) {
        count = subscriptionCount.reduce((sum, item) => sum + item._count, 0)
      }

      return {
        subscriptionFlowId: f.id,
        subscriptionCount: count
      }
    })
  }
}
