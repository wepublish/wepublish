import {Args, Mutation, Query, Resolver} from '@nestjs/graphql'
import {
  DeletePollVotesResult,
  PaginatedPollVotes,
  PoleVoteByIdArgs,
  PoleVoteListArgs,
  PollVote
} from './poll-vote.model'
import {PollVoteService} from './poll-vote.service'

@Resolver(() => PollVote)
export class PollVoteResolver {
  constructor(readonly pollService: PollVoteService) {}

  @Query(returns => PaginatedPollVotes, {
    description: `Returns a paginated list of poll votes`
  })
  public pollVotes(@Args() filter: PoleVoteListArgs) {
    return this.pollService.getPollVotes(filter)
  }

  @Mutation(returns => DeletePollVotesResult, {
    description: `Delete poll votes`
  })
  public deletePollVotes(@Args() {ids}: PoleVoteByIdArgs) {
    return this.pollService.deletePollVotes({ids})
  }
}
