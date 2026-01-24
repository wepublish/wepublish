import {
  Args,
  Int,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { Public } from '@wepublish/authentication/api';
import { FullPoll, PollAnswerWithVoteCount } from './poll.model';
import {
  PollDataloaderService,
  PrismaFullPoll,
} from './poll-dataloader.service';
import { BadRequestException } from '@nestjs/common';

@Resolver(() => FullPoll)
export class PollResolver {
  constructor(private pollDataloader: PollDataloaderService) {}

  @Query(() => FullPoll)
  @Public()
  async poll(@Args('id') id: string) {
    const poll = await this.pollDataloader.load(id);

    if (!poll) {
      throw new BadRequestException('Poll not found');
    }

    return poll;
  }
}

@Resolver(() => PollAnswerWithVoteCount)
export class PollAnswerWithVoteCountResolver {
  @ResolveField(() => Int)
  async votes(@Parent() pollAnswer: PrismaFullPoll['answers'][number]) {
    return pollAnswer._count.votes;
  }
}
