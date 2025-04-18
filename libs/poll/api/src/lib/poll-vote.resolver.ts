import {Args, Mutation, Query, Resolver} from '@nestjs/graphql'
import {
  DeletePollVotesResult,
  PaginatedPollVotes,
  PoleVoteByIdArgs,
  PoleVoteListArgs,
  PollVote
} from './poll-vote.model'
import {PollVoteService} from './poll-vote.service'
import {CanDeletePollVote, CanGetPollVote} from '@wepublish/permissions'
import {Permissions} from '@wepublish/permissions/api'

@Resolver(() => PollVote)
export class PollVoteResolver {
  constructor(readonly pollService: PollVoteService) {}

  @Permissions(CanGetPollVote)
  @Query(returns => PaginatedPollVotes, {
    description: `Returns a paginated list of poll votes`
  })
  public pollVotes(@Args() filter: PoleVoteListArgs) {
    return this.pollService.getPollVotes(filter)
  }

  @Permissions(CanDeletePollVote)
  @Mutation(returns => DeletePollVotesResult, {
    description: `Delete poll votes`
  })
  public deletePollVotes(@Args() {ids}: PoleVoteByIdArgs) {
    return this.pollService.deletePollVotes({ids})
  }
}
