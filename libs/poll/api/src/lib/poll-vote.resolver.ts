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
import {Authenticated, CurrentUser, UserSession} from '@wepublish/authentication/api'

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

  @Query(() => String, {nullable: true})
  @Authenticated()
  async userPollVote(
    @Args('pollId') pollId: string,
    @CurrentUser() {user}: UserSession
  ): Promise<string | null> {
    return this.pollService.userPollVote(pollId, user.id)
  }
}
