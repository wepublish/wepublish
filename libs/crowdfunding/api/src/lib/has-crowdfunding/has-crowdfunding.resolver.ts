import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import {
  HasCrowdfunding,
  HasOptionalCrowdfunding,
} from './has-crowdfunding.model';
import { CrowdfundingDataloaderService } from '../crowdfunding-dataloader.service';
import { CrowdfundingWithActiveGoal } from '../crowdfunding.model';

@Resolver(() => HasCrowdfunding)
export class HasCrowdfundingResolver {
  constructor(private dataloader: CrowdfundingDataloaderService) {}

  @ResolveField(() => CrowdfundingWithActiveGoal, { nullable: true })
  public crowdfunding(
    @Parent() block: HasOptionalCrowdfunding | HasCrowdfunding
  ) {
    const id = block.crowdfundingId;

    if (!id) {
      return null;
    }

    return this.dataloader.load(id);
  }
}

@Resolver(() => HasOptionalCrowdfunding)
export class HasOptionalCrowdfundingResolver extends HasCrowdfundingResolver {}
