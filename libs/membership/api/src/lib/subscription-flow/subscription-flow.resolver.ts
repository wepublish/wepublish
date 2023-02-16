import {Args, Int, Mutation, Query, Resolver} from '@nestjs/graphql'
import {
  SubscriptionFlowModel,
  SubscriptionFlowModelCreateInput,
  SubscriptionFlowModelUpdateInput,
  SubscriptionIntervalCreateInput,
  SubscriptionIntervalDeleteInput,
  SubscriptionIntervalUpdateInput
} from './subscription-flow.model'
import {SubscriptionFlowController} from './subscription-flow.controller'

@Resolver(() => [SubscriptionFlowResolver])
export class SubscriptionFlowResolver {
  constructor(private readonly controller: SubscriptionFlowController) {}

  // Subscription Flow
  @Query(returns => [SubscriptionFlowModel], {name: 'SubscriptionFlows'})
  async subscriptionFlow(@Args('defaultFlowOnly') defaultFlowOnly: boolean) {
    return await this.controller.getFlow(defaultFlowOnly)
  }

  @Mutation(returns => [SubscriptionFlowModel], {name: 'createSubscriptionFlow'})
  async createSubscriptionFlow(@Args('subscriptionFlow') flow: SubscriptionFlowModelCreateInput) {
    return await this.controller.createFlow(flow)
  }

  @Mutation(returns => [SubscriptionFlowModel], {name: 'updateSubscriptionFlow'})
  async updateSubscriptionFlow(@Args('subscriptionFlow') flow: SubscriptionFlowModelUpdateInput) {
    return await this.controller.updateFlow(flow)
  }

  @Mutation(returns => [SubscriptionFlowModel], {name: 'deleteSubscriptionFlow'})
  async deleteSubscriptionFlow(
    @Args('subscriptionFlowId', {type: () => Int}) subscriptionFlowId: number
  ) {
    return await this.controller.deleteFlow(subscriptionFlowId)
  }

  @Mutation(() => [SubscriptionFlowModel], {name: 'createSubscriptionInterval'})
  async createSubscriptionInterval(
    @Args('subscriptionInterval') subscriptionInterval: SubscriptionIntervalCreateInput
  ) {
    return this.controller.createInterval(subscriptionInterval)
  }

  @Mutation(() => [SubscriptionFlowModel], {name: 'updateSubscriptionInterval'})
  async updateSubscriptionInterval(
    @Args('subscriptionInterval') subscriptionInterval: SubscriptionIntervalUpdateInput
  ) {
    return this.controller.updateInterval(subscriptionInterval)
  }

  @Mutation(() => [SubscriptionFlowModel], {name: 'deleteSubscriptionInterval'})
  async deleteSubscriptionInterval(
    @Args('subscriptionInterval') subscriptionInterval: SubscriptionIntervalDeleteInput
  ) {
    return this.controller.deleteInterval(subscriptionInterval)
  }
}
