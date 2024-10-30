import {Resolver, Query} from '@nestjs/graphql'
import {Crowdfunding, PaginatedCrowdfundings} from './crowdfunding.model'
import {CrowdfundingService} from './crowdfunding.service'

@Resolver(() => Crowdfunding)
export class CrowdfundingResolver {
  constructor(private crowdfundingService: CrowdfundingService) {}

  @Query(() => PaginatedCrowdfundings, {
    description: 'Returns a paginated list of crowdfundings.'
  })
  public crowdfundings() {
    return this.crowdfundingService.getCrowdfundings()
  }
}
