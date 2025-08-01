import {Args, Parent, Query, ResolveField, Resolver} from '@nestjs/graphql'
import {Public} from '@wepublish/authentication/api'
import {FullPoll, PollAnswerWithVoteCount} from './poll.model'
import {PollDataloaderService, PrismaFullPoll} from './poll-dataloader.service'
import {UserInputError} from '@nestjs/apollo'

@Resolver(() => FullPoll)
export class PollResolver {
  constructor(private readonly pollDataloader: PollDataloaderService) {}

  @Query(() => FullPoll)
  @Public()
  async poll(@Args('id') id: string) {
    const poll = await this.pollDataloader.load(id)
    if (null == poll) {
      throw new UserInputError('Poll not found')
    }
    return poll
  }
}

@Resolver(() => PollAnswerWithVoteCount)
export class PollAnswerWithVoteCountResolver {
  @ResolveField()
  async votes(@Parent() pollAnswer: PrismaFullPoll['answers'][number]): Promise<number> {
    return pollAnswer._count.votes
  }
}
