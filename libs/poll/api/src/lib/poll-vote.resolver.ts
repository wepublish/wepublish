import {Args, Query, Resolver} from '@nestjs/graphql'
import {PaginatedPollVotes, PoleVoteListArgs, PollVote} from './poll-vote.model'
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
}
