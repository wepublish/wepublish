import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import {
  DeletePollVotesResult,
  PaginatedPollVotes,
  PoleVoteByIdArgs,
  PoleVoteListArgs,
  PollVote,
} from './poll-vote.model';
import { PollVoteService } from './poll-vote.service';
import { CanDeletePollVote, CanGetPollVote } from '@wepublish/permissions';
import { Permissions } from '@wepublish/permissions/api';
import {
  Authenticated,
  CurrentUser,
  Public,
  RequestFingerprint,
  UserSession,
} from '@wepublish/authentication/api';

@Resolver(() => PollVote)
export class PollVoteResolver {
  constructor(readonly pollService: PollVoteService) {}

  @Permissions(CanGetPollVote)
  @Query(returns => PaginatedPollVotes, {
    description: `Returns a paginated list of poll votes`,
  })
  public pollVotes(@Args() filter: PoleVoteListArgs) {
    return this.pollService.getPollVotes(filter);
  }

  @Permissions(CanDeletePollVote)
  @Mutation(returns => DeletePollVotesResult, {
    description: `Delete poll votes`,
  })
  public deletePollVotes(@Args() { ids }: PoleVoteByIdArgs) {
    return this.pollService.deletePollVotes({ ids });
  }

  @Query(() => String, { nullable: true })
  @Authenticated()
  async userPollVote(
    @Args('pollId') pollId: string,
    @CurrentUser() { user }: UserSession
  ): Promise<string | null> {
    return this.pollService.userPollVote(pollId, user.id);
  }

  @Public()
  @Mutation(() => PollVote, {
    nullable: true,
    description: `This mutation allows to vote on a poll (or update one's decision). Supports logged in and anonymous`,
  })
  async voteOnPoll(
    @Args('answerId') answerId: string,
    @CurrentUser() session: UserSession | null,
    @RequestFingerprint() fingerprint: string
  ) {
    return this.pollService.voteOnPoll(
      answerId,
      fingerprint,
      session?.user?.id
    );
  }
}
