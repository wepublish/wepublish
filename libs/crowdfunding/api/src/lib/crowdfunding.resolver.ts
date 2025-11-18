import {
  Resolver,
  Query,
  Mutation,
  Args,
  ResolveField,
  Parent,
} from '@nestjs/graphql';
import {
  CreateCrowdfundingInput,
  CrowdfundingId,
  Crowdfunding,
  UpdateCrowdfundingInput,
} from './crowdfunding.model';
import { CrowdfundingService } from './crowdfunding.service';
import { Permissions } from '@wepublish/permissions/api';
import {
  CanGetCrowdfunding,
  CanCreateCrowdfunding,
  CanUpdateCrowdfunding,
  CanGetCrowdfundings,
  CanDeleteCrowdfunding,
} from '@wepublish/permissions';
import { CrowdfundingGoal } from './crowdfunding-goal.model';
import { Crowdfunding as PCrowdfunding } from '@prisma/client';
import { CrowdfundingGoalDataloader } from './crowdfunding-goal.dataloader';
import { CrowdfundingDataloaderService } from './crowdfunding-dataloader.service';
import { CrowdfundingMemberPlanDataloader } from './crowdfunding-memberplan.dataloader';

@Resolver(() => Crowdfunding)
export class CrowdfundingResolver {
  constructor(
    private crowdfundingService: CrowdfundingService,
    private crowdfundingDataloader: CrowdfundingDataloaderService,
    private crowdfundingMemberPlanDataloader: CrowdfundingMemberPlanDataloader,
    private crowdfundingGoalDataloader: CrowdfundingGoalDataloader
  ) {}

  @Permissions(CanGetCrowdfunding)
  @Query(() => Crowdfunding, {
    description: 'Get a single crowdfunding by id',
  })
  public crowdfunding(@Args() { id }: CrowdfundingId) {
    return this.crowdfundingDataloader.load(id);
  }

  @Permissions(CanGetCrowdfundings)
  @Query(() => [Crowdfunding], {
    description: 'Returns a list of crowdfundings.',
  })
  public crowdfundings() {
    return this.crowdfundingService.getCrowdfundings();
  }

  @Permissions(CanCreateCrowdfunding)
  @Mutation(() => Crowdfunding, {
    description: 'Create a new crowdfunding',
  })
  public createCrowdfunding(
    @Args('input') crowdfunding: CreateCrowdfundingInput
  ) {
    return this.crowdfundingService.createCrowdfunding(crowdfunding);
  }

  @Permissions(CanUpdateCrowdfunding)
  @Mutation(() => Crowdfunding, {
    description: 'Updates a single crowdfunding',
  })
  public updateCrowdfunding(
    @Args('input') crowdfunding: UpdateCrowdfundingInput
  ) {
    return this.crowdfundingService.updateCrowdfunding(crowdfunding);
  }

  @Permissions(CanDeleteCrowdfunding)
  @Mutation(() => Boolean, { nullable: true })
  async deleteCrowdfunding(@Args() { id }: CrowdfundingId): Promise<void> {
    await this.crowdfundingService.delete(id);
  }

  @ResolveField(() => [CrowdfundingGoal])
  async goals(@Parent() parent: PCrowdfunding) {
    return (await this.crowdfundingGoalDataloader.load(parent.id)) ?? [];
  }

  @ResolveField(() => Number)
  async memberPlans(@Parent() parent: PCrowdfunding) {
    return (await this.crowdfundingMemberPlanDataloader.load(parent.id)) ?? [];
  }

  @ResolveField(() => Number)
  async revenue(@Parent() parent: PCrowdfunding) {
    return this.crowdfundingService.getRevenue(
      parent,
      (await this.memberPlans(parent)).map(({ id }) => id)
    );
  }

  @ResolveField(() => Number)
  async subscriptions(@Parent() parent: PCrowdfunding) {
    return (
      (
        await this.crowdfundingService.getSubscriptions(
          parent,
          (await this.memberPlans(parent)).map(({ id }) => id)
        )
      ).length + (parent.additionalRevenue ?? 0)
    );
  }

  @ResolveField(() => String, { nullable: true })
  async activeGoal(@Parent() parent: PCrowdfunding) {
    return this.crowdfundingService.getActiveGoalWithProgress({
      goalType: parent.goalType,
      goals: await this.goals(parent),
      revenue: await this.revenue(parent),
      subscriptions: await this.subscriptions(parent),
    });
  }
}
