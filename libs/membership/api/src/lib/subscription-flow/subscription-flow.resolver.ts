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
    description: 'Count of all subscriptions that are affected by this flow',
  })
  async numberOfSubscriptions(
    @Parent() flow: SubscriptionFlowModel
  ): Promise<number> {
    return await this.prismaService.subscription.count({
      where: {
        OR: flow.autoRenewal.map(autoRenew => ({
          paymentMethodID: {
            in: flow.paymentMethods.map(paymentMethod => paymentMethod.id),
          },
          paymentPeriodicity: {
            in: flow.periodicities,
          },
          autoRenew,
        })),
      },
    });
  }
}
