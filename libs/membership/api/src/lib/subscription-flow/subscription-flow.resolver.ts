import {
  Args,
  Int,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import {
  CanCreateSubscriptionFlow,
  CanDeleteSubscriptionFlow,
  CanGetSubscriptionFlows,
  CanUpdateSubscriptionFlow,
} from '@wepublish/permissions';
import { SubscriptionFlowService } from './subscription-flow.service';
import {
  SubscriptionFlowCountFilter,
  SubscriptionFlowEarliestDay,
  SubscriptionFlowModel,
  SubscriptionFlowModelCreateInput,
  SubscriptionFlowModelUpdateInput,
  SubscriptionIntervalCreateInput,
  SubscriptionIntervalUpdateInput,
} from './subscription-flow.model';
import { PrismaClient } from '@prisma/client';
import { Permissions } from '@wepublish/permissions/api';

@Resolver(() => SubscriptionFlowModel)
export class SubscriptionFlowResolver {
  constructor(
    private subscriptionFlowService: SubscriptionFlowService,
    private prismaService: PrismaClient
  ) {}

  @Permissions(CanGetSubscriptionFlows)
  @Query(() => [SubscriptionFlowModel], {
    description: `Returns all subscription flows`,
  })
  async subscriptionFlows(
    @Args('defaultFlowOnly') defaultFlowOnly: boolean,
    @Args('memberPlanId', { nullable: true }) memberPlanId?: string
  ) {
    return await this.subscriptionFlowService.getFlows(
      defaultFlowOnly,
      memberPlanId
    );
  }

  @Permissions(CanCreateSubscriptionFlow)
  @Mutation(() => [SubscriptionFlowModel], {
    description: `Create a new subscription flow`,
  })
  async createSubscriptionFlow(@Args() flow: SubscriptionFlowModelCreateInput) {
    return await this.subscriptionFlowService.createFlow(flow);
  }

  @Permissions(CanUpdateSubscriptionFlow)
  @Mutation(() => [SubscriptionFlowModel], {
    description: `Update an existing subscription flow`,
  })
  async updateSubscriptionFlow(@Args() flow: SubscriptionFlowModelUpdateInput) {
    return await this.subscriptionFlowService.updateFlow(flow);
  }

  @Permissions(CanDeleteSubscriptionFlow)
  @Mutation(() => [SubscriptionFlowModel], {
    description: `Delete an existing subscription flow`,
  })
  async deleteSubscriptionFlow(@Args('id') subscriptionFlowId: string) {
    return await this.subscriptionFlowService.deleteFlow(subscriptionFlowId);
  }

  @Permissions(CanCreateSubscriptionFlow, CanUpdateSubscriptionFlow)
  @Mutation(() => [SubscriptionFlowModel], {
    description: 'Create a subscription interval',
  })
  async createSubscriptionInterval(
    @Args() subscriptionInterval: SubscriptionIntervalCreateInput
  ) {
    return await this.subscriptionFlowService.createInterval(
      subscriptionInterval
    );
  }

  @Permissions(CanUpdateSubscriptionFlow)
  @Mutation(() => [SubscriptionFlowModel], {
    description: 'Update an existing subscription interval',
  })
  async updateSubscriptionInterval(
    @Args() subscriptionInterval: SubscriptionIntervalUpdateInput
  ) {
    return await this.subscriptionFlowService.updateInterval(
      subscriptionInterval
    );
  }

  @Permissions(CanUpdateSubscriptionFlow)
  @Mutation(() => [SubscriptionFlowModel], {
    description: 'Delete an existing subscription interval',
  })
  async deleteSubscriptionInterval(@Args('id') id: string) {
    return await this.subscriptionFlowService.deleteInterval(id);
  }

  @ResolveField('numberOfSubscriptions', () => Int, {
    description:
      'The subscriptions this flow handles: running ones and those ended within its latest day, each counted in the one flow it falls into. Zero for an inactive flow.',
  })
  async numberOfSubscriptions(
    @Parent() flow: SubscriptionFlowModel,
    @Args('memberPlanId', { type: () => String, nullable: true })
    memberPlanId?: string | null
  ): Promise<number> {
    return this.subscriptionFlowService.countSubscriptions(
      flow as never,
      memberPlanId ? { memberPlanIds: [memberPlanId] } : {}
    );
  }

  @ResolveField('subscriptionCount', () => Int, {
    description:
      'numberOfSubscriptions, narrowed to what a list of flows is filtered by.',
  })
  async subscriptionCount(
    @Parent() flow: SubscriptionFlowModel,
    @Args('filter', { type: () => SubscriptionFlowCountFilter, nullable: true })
    filter?: SubscriptionFlowCountFilter | null
  ): Promise<number> {
    return this.subscriptionFlowService.countSubscriptions(
      flow as never,
      filter ?? {}
    );
  }

  @Permissions(CanGetSubscriptionFlows)
  @Query(() => Int, {
    description:
      'How many subscriptions a flow handles, or would handle once switched on. Not narrowed by any filter.',
  })
  async subscriptionFlowHandledCount(@Args('id') id: string): Promise<number> {
    return this.subscriptionFlowService.handledCount(id);
  }

  @Permissions(CanUpdateSubscriptionFlow)
  @Mutation(() => [SubscriptionFlowModel], {
    description:
      'Switches a flow on or off. The default flow stays on; a flow switched on must not share subscriptions with another active flow.',
  })
  async setSubscriptionFlowActive(
    @Args('id') id: string,
    @Args('active') active: boolean
  ) {
    return this.subscriptionFlowService.setFlowActive(id, active);
  }

  @ResolveField('earliestDay', () => SubscriptionFlowEarliestDay)
  async earliestDay(
    @Parent() flow: SubscriptionFlowModel
  ): Promise<SubscriptionFlowEarliestDay> {
    return this.subscriptionFlowService.earliestDay(flow);
  }
}
