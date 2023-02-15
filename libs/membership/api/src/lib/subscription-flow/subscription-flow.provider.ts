import {Args, Int, Mutation, Query, Resolver} from '@nestjs/graphql'
import {
  AdditionalIntervalCreateInput,
  AdditionalIntervalDeleteInput,
  SubscriptionFlowModel,
  SubscriptionFlowModelCreateInput,
  SubscriptionFlowModelUpdateInput,
  SubscriptionInterval,
  SubscriptionIntervalCreated,
  SubscriptionIntervalUpdateInput
} from './subscription-flow.model'
import {SubscriptionFlowController} from './subscription-flow.controller'

@Resolver(of => [SubscriptionFlowProvider])
export class SubscriptionFlowProvider {
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

  /**
  @Mutation(() => [SubscriptionFlowModel], {name: 'updateSubscriptionInterval'})
  async updateSubscriptionInterval(
    @Args('subscriptionInterval') subscriptionInterval: SubscriptionIntervalUpdateInput
  ) {
    return this.controller.updateSubscriptionInterval(subscriptionInterval)
  }

  @Mutation(() => SubscriptionIntervalCreated, {name: 'createSubscriptionInterval'})
  async createSubscriptionInterval(
    @Args('subscriptionInterval') subscriptionInterval: SubscriptionIntervalCreateInput
  ) {
    return this.controller.createSubscriptionInterval(subscriptionInterval)
  }

  @Mutation(() => [SubscriptionFlowModel], {name: 'removeAdditionalIntervalToSubscriptionFlow'})
  async removeAdditionalIntervalToSubscriptionFlow(
    @Args('additionalInterval') additionalInterval: AdditionalIntervalDeleteInput
  ) {
    return this.controller.removeAdditionalIntervalToSubscriptionFlow(additionalInterval)
  }

  @Mutation(() => [SubscriptionFlowModel], {name: 'addAdditionalIntervalToSubscriptionFlow'})
  async addAdditionalIntervalToSubscriptionFlow(
    @Args('additionalInterval') additionalInterval: AdditionalIntervalCreateInput
  ) {
    return this.controller.addAdditionalIntervalToSubscriptionFlow(additionalInterval)
  }


  @Mutation(returns => [SubscriptionFlowModel], {name: 'createAndLinkSubscriptionInterval'})
  async createAndLinkSubscriptionInterval(
    @Args('subscriptionInterval') additionalInterval: SubscriptionIntervalCreate
  ) {
    return await this.controller.createAndLinkSubscriptionInterval(additionalInterval)
  }
  **/
}
