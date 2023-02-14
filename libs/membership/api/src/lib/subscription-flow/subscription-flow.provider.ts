import {Args, Int, Mutation, Query, Resolver} from '@nestjs/graphql'
import {
  SubscriptionFlowModel,
  SubscriptionFlowModelCreateInput,
  SubscriptionFlowModelUpdateInput,
  SubscriptionIntervalUpdateInput
} from './subscription-flow.model'
import {SubscriptionFlowController} from './subscription-flow.controller'

@Resolver(of => [SubscriptionFlowProvider])
export class SubscriptionFlowProvider {
  constructor(private readonly controller: SubscriptionFlowController) {}

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

  @Mutation(() => [SubscriptionFlowModel], { name: 'updateSubscriptionInterval' })
  async updateSubscriptionInterval(@Args('subscriptionInterval') subscriptionInterval: SubscriptionIntervalUpdateInput) {
    return this.controller.updateSubscriptionInterval(subscriptionInterval)
  }

  @Mutation(returns => [SubscriptionFlowModel], {name: 'deleteSubscriptionFlow'})
  async deleteSubscriptionFlow(@Args('subscriptionFlowId', { type: () => Int }) subscriptionFlowId: number) {
    return await this.controller.deleteFlow(subscriptionFlowId)
  }
}
