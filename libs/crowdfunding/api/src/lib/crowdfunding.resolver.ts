import {Resolver, Query, Mutation, Args} from '@nestjs/graphql'
import {
  CreateCrowdfundingInput,
  Crowdfunding,
  CrowdfundingId,
  UpdateCrowdfundingInput
} from './crowdfunding.model'
import {CrowdfundingService} from './crowdfunding.service'
import {
  Permissions,
  CanGetCrowdfunding,
  CanCreateCrowdfunding,
  CanUpdateCrowdfunding,
  CanGetCrowdfundings
} from '@wepublish/permissions/api'

@Resolver(() => Crowdfunding)
export class CrowdfundingResolver {
  constructor(private crowdfundingService: CrowdfundingService) {}

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

  @Permissions(CanCreateCrowdfunding)
  @Mutation(returns => Crowdfunding, {description: 'Create a new Crowdfunding'})
  public createCrowdfunding(@Args('input') crowdfunding: CreateCrowdfundingInput) {
    return this.crowdfundingService.createCrowdfunding(crowdfunding)
  }

  @Permissions(CanUpdateCrowdfunding)
  @Mutation(returns => Crowdfunding, {description: 'Update a sinle crowdfunding'})
  public updateCrowdunding(@Args('input') crowdfunding: UpdateCrowdfundingInput) {
    return this.crowdfundingService.updateCrowdfunding(crowdfunding)
  }
}
