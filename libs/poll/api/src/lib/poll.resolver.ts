import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Public } from '@wepublish/authentication/api';
import {
  CreatePollExternalVoteSourceInput,
  CreatePollInput,
  FullPoll,
  PaginatedPolls,
  PollExternalVoteSource,
  PollListArgs,
  UpdatePollInput,
} from './poll.model';
import { PollDataloaderService } from './poll-dataloader.service';
import { PollService } from './poll.service';
import {
  CanCreatePoll,
  CanUpdatePoll,
  CanDeletePoll,
} from '@wepublish/permissions';
import { Permissions } from '@wepublish/permissions/api';
import { NotFoundException } from '@nestjs/common';

@Resolver(() => FullPoll)
export class PollResolver {
  constructor(
    private dataloader: PollDataloaderService,
    private service: PollService
  ) {}

  @Public()
  @Query(() => PaginatedPolls, {
    description: `Returns a paginated list of polls based on the filters given.`,
  })
  public polls(@Args() filter: PollListArgs) {
    return this.service.getPolls(filter);
  }

  @Public()
  @Query(() => FullPoll)
  async poll(@Args('id') id: string) {
    const poll = await this.dataloader.load(id);

    if (!poll) {
      throw new NotFoundException(`Poll with id ${id} was not found.`);
    }

    return poll;
  }

  @Permissions(CanCreatePoll)
  @Mutation(returns => FullPoll, { description: `Creates a new poll.` })
  public createPoll(@Args() poll: CreatePollInput) {
    return this.service.createPoll(poll);
  }

  @Permissions(CanCreatePoll)
  @Mutation(returns => PollExternalVoteSource, {
    description: `Creates a new external vote source.`,
  })
  public createPollExternalVoteSource(
    @Args() voteSource: CreatePollExternalVoteSourceInput
  ) {
    return this.service.createPollExternalVoteSource(voteSource);
  }

  @Permissions(CanUpdatePoll)
  @Mutation(returns => FullPoll, { description: `Updates an existing poll.` })
  public updatePoll(@Args() poll: UpdatePollInput) {
    return this.service.updatePoll(poll);
  }

  @Permissions(CanDeletePoll)
  @Mutation(returns => FullPoll, { description: `Deletes an existing poll.` })
  public deletePoll(@Args('id') id: string) {
    return this.service.deletePoll(id);
  }

  @Permissions(CanUpdatePoll)
  @Mutation(returns => PollExternalVoteSource, {
    description: `Deletes an existing external vote source.`,
  })
  public deletePollExternalVoteSource(@Args('id') id: string) {
    return this.service.deletePollExternalVoteSource(id);
  }
}
