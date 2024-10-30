import {Resolver, Query, Mutation, Args} from '@nestjs/graphql'
import {
  CreateCrowdfundingInput,
  Crowdfunding,
  CrowdfundingId,
  PaginatedCrowdfundings,
  UpdateCrowdfundingInput
} from './crowdfunding.model'
import {CrowdfundingService} from './crowdfunding.service'

@Resolver(() => Crowdfunding)
export class CrowdfundingResolver {
  constructor(private crowdfundingService: CrowdfundingService) {}

  @Query(() => Crowdfunding, {description: 'Get a single crowdfunding by id'})
  public crowdfunding(@Args() {id}: CrowdfundingId) {
    return this.crowdfundingService.getCrowdfundingById(id)
  }

  @Query(() => PaginatedCrowdfundings, {
    description: 'Returns a paginated list of crowdfundings.'
  })
  public crowdfundings() {
    return this.crowdfundingService.getCrowdfundings()
  }

  @Mutation(returns => Crowdfunding, {description: 'Create a new Crowdfunding'})
  public createCrowdfunding(@Args('input') crowdfunding: CreateCrowdfundingInput) {
    return this.crowdfundingService.createCrowdfunding(crowdfunding)
  }

  @Mutation(returns => Crowdfunding, {description: 'Update a sinle crowdfunding'})
  public updateCrowdunding(@Args('input') crowdfunding: UpdateCrowdfundingInput) {
    return this.crowdfundingService.updateCrowdfunding(crowdfunding)
  }
}
