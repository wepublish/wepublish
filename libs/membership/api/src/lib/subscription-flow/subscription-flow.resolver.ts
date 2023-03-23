import {Args, Int, Mutation, Query, Resolver} from '@nestjs/graphql'
import {
  PaymentMethodRef,
  SubscriptionFlowModel,
  SubscriptionFlowModelCreateInput,
  SubscriptionFlowModelUpdateInput,
  SubscriptionIntervalCreateInput,
  SubscriptionIntervalDeleteInput,
  SubscriptionIntervalUpdateInput
} from './subscription-flow.model'
import {SubscriptionFlowController} from './subscription-flow.controller'
import {SubscriptionFlow} from '@prisma/client'
import {PrismaService} from '@wepublish/api'
import {SubscriptionFlowHelper, SubscriptionFlowWithPaymentMethod} from './subscription-flow.helper'

type WithNumberOfSubscriptions<T> = T & {
  numberOfSubscriptions: number
}
import {CanGetSubscriptionFlows, Permissions} from '@wepublish/permissions/api'

@Resolver(() => [SubscriptionFlowResolver])
export class SubscriptionFlowResolver {
  constructor(
    private readonly controller: SubscriptionFlowController,
    private readonly prismaService: PrismaService,
    private readonly flowHelper: SubscriptionFlowHelper
  ) {}

  @Permissions(CanGetSubscriptionFlows)
  @Query(() => [SubscriptionFlowModel], {name: 'subscriptionFlows'})
  async subscriptionFlows(
    @Args('defaultFlowOnly') defaultFlowOnly: boolean,
    @Args('memberPlanId', {nullable: true}) memberPlanId?: string
  ) {
    return this.decorate(await this.controller.getFlows(defaultFlowOnly, memberPlanId))
  }

  @Mutation(() => [SubscriptionFlowModel], {name: 'createSubscriptionFlow'})
  async createSubscriptionFlow(@Args('subscriptionFlow') flow: SubscriptionFlowModelCreateInput) {
    return this.decorate(await this.controller.createFlow(flow))
  }

  @Mutation(() => [SubscriptionFlowModel], {name: 'updateSubscriptionFlow'})
  async updateSubscriptionFlow(@Args('subscriptionFlow') flow: SubscriptionFlowModelUpdateInput) {
    return this.decorate(await this.controller.updateFlow(flow))
  }

  @Mutation(() => [SubscriptionFlowModel], {name: 'deleteSubscriptionFlow'})
  async deleteSubscriptionFlow(
    @Args('subscriptionFlowId', {type: () => Int}) subscriptionFlowId: number
  ) {
    return this.decorate(await this.controller.deleteFlow(subscriptionFlowId))
  }

  @Mutation(() => [SubscriptionFlowModel], {name: 'createSubscriptionInterval'})
  async createSubscriptionInterval(
    @Args('subscriptionInterval') subscriptionInterval: SubscriptionIntervalCreateInput
  ) {
    return this.decorate(await this.controller.createInterval(subscriptionInterval))
  }

  @Mutation(() => [SubscriptionFlowModel], {name: 'updateSubscriptionIntervals'})
  async updateSubscriptionIntervals(
    @Args({name: 'subscriptionIntervals', type: () => [SubscriptionIntervalUpdateInput]})
    subscriptionIntervals: SubscriptionIntervalUpdateInput[]
  ) {
    return this.decorate(await this.controller.updateIntervals(subscriptionIntervals))
  }

  @Mutation(() => [SubscriptionFlowModel], {name: 'updateSubscriptionInterval'})
  async updateSubscriptionInterval(
    @Args('subscriptionInterval') subscriptionInterval: SubscriptionIntervalUpdateInput
  ) {
    return this.decorate(await this.controller.updateInterval(subscriptionInterval))
  }

  @Mutation(() => [SubscriptionFlowModel], {name: 'deleteSubscriptionInterval'})
  async deleteSubscriptionInterval(
    @Args('subscriptionInterval') subscriptionInterval: SubscriptionIntervalDeleteInput
  ) {
    return this.decorate(await this.controller.deleteInterval(subscriptionInterval))
  }

  @Query(() => [PaymentMethodRef])
  async paymentMethods() {
    return this.controller.paymentMethods()
  }

  private async decorate(
    flows: SubscriptionFlowWithPaymentMethod[]
  ): Promise<WithNumberOfSubscriptions<SubscriptionFlow>[]> {
    const subscriptionCounts = await this.flowHelper.numberOfSubscriptionsFor(flows)

    return flows.map(f => {
      const count = subscriptionCounts.find(c => c.subscriptionFlowId === f.id)

      return {
        ...f,
        numberOfSubscriptions: (count && count.subscriptionCount) || 0
      }
    })
  }
}
