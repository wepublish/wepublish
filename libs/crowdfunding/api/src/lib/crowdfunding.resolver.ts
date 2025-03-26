import {Resolver, Query, Mutation, Args, ResolveField, Parent} from '@nestjs/graphql'
import {
  CreateCrowdfundingInput,
  Crowdfunding,
  CrowdfundingId,
  UpdateCrowdfundingInput
} from './crowdfunding.model'
import {CrowdfundingService} from './crowdfunding.service'
import {Permissions} from '@wepublish/permissions/api'
import {
  CanGetCrowdfunding,
  CanCreateCrowdfunding,
  CanUpdateCrowdfunding,
  CanGetCrowdfundings,
  CanDeleteCrowdfunding
} from '@wepublish/permissions'
import {CrowdfundingGoal} from './crowdfunding-goal.model'
import {CrowdfundingGoalService} from './crowdfunding-goal.service'

@Resolver(() => Crowdfunding)
export class CrowdfundingResolver {
  constructor(
    private crowdfundingService: CrowdfundingService,
    private crowdfundingGoalService: CrowdfundingGoalService
  ) {}

  @Permissions(CanGetCrowdfunding)
  @Query(() => Crowdfunding, {description: 'Get a single crowdfunding by id'})
  public crowdfunding(@Args() {id}: CrowdfundingId) {
    return this.crowdfundingService.getCrowdfundingById(id)
  }

  @Permissions(CanGetCrowdfundings)
  @Query(() => [Crowdfunding], {
    description: 'Returns a paginated list of crowdfundings.'
  })
  public crowdfundings() {
    return this.crowdfundingService.getCrowdfundings()
  }

  @ResolveField(() => [CrowdfundingGoal])
  async goals(@Parent() crowdfunding: Crowdfunding) {
    const {id} = crowdfunding
    return this.crowdfundingGoalService.findAll({crowdfundingId: id})
  }

  @Permissions(CanCreateCrowdfunding)
  @Mutation(returns => Crowdfunding, {description: 'Create a new Crowdfunding'})
  public createCrowdfunding(@Args('input') crowdfunding: CreateCrowdfundingInput) {
    return this.crowdfundingService.createCrowdfunding(crowdfunding)
  }

  @Permissions(CanUpdateCrowdfunding)
  @Mutation(returns => Crowdfunding, {description: 'Update a sinle crowdfunding'})
  public updateCrowdfunding(@Args('input') crowdfunding: UpdateCrowdfundingInput) {
    return this.crowdfundingService.updateCrowdfunding(crowdfunding)
  }

  @Permissions(CanDeleteCrowdfunding)
  @Mutation(() => Boolean, {nullable: true})
  async deleteCrowdfunding(@Args() {id}: CrowdfundingId): Promise<void> {
    await this.crowdfundingService.delete(id)
  }
}
