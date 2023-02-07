import {Args, Mutation, Query, Resolver} from '@nestjs/graphql'
import {SubscriptionFlowModel, SubscriptionFlowModelCreateInput} from './subscription-flow.model'
import {PrismaService} from '@wepublish/api'
import {SubscriptionFlowController} from './subscription-flow.controller'

@Resolver(of => [SubscriptionFlowProvider])
export class SubscriptionFlowProvider {
  private controller
  constructor(private readonly prismaService: PrismaService) {
    this.controller = new SubscriptionFlowController(prismaService)
  }

  @Query(returns => [SubscriptionFlowModel], {name: 'SubscriptionFlows'})
  async subscriptionFlow(@Args('defaultFlowOnly') defaultFlowOnly: boolean) {
    return await this.controller.getFlow(defaultFlowOnly)
  }

  @Mutation(returns => SubscriptionFlowModel, {name: 'createSubscriptionFlow'})
  async createSubscriptionFlow(@Args('subscriptionFlow') flow: SubscriptionFlowModelCreateInput) {
    return await this.controller.createFlow(flow)
  }
}
