import {Args, Mutation, Query, Resolver} from '@nestjs/graphql'
import {PaginatedPollVotes, PoleVoteByIdArgs, PoleVoteListArgs, PollVote} from './poll-vote.model'
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

  @Mutation(returns => PollVote, {
    description: `Delete poll vote`
  })
  public deletePollVote(@Args() {id}: PoleVoteByIdArgs) {
    return this.pollService.deletePollVote({id})
  }
}
