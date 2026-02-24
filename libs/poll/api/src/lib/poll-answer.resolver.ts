import {
  Args,
  Int,
  Mutation,
  Parent,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { PrismaFullPoll } from './poll-dataloader.service';
import { CreatePollAnswerInput, PollAnswer } from './poll-answer.model';
import { CanCreatePoll, CanUpdatePoll } from '@wepublish/permissions';
import { Permissions } from '@wepublish/permissions/api';
import { PollService } from './poll.service';

@Resolver(() => PollAnswer)
export class PollAnswerResolver {
  constructor(private service: PollService) {}

  @Permissions(CanCreatePoll)
  @Mutation(returns => PollAnswer, {
    description: `Creates a new poll answer.`,
  })
  public createPollAnswer(@Args() answer: CreatePollAnswerInput) {
    return this.service.createPollAnswer(answer);
  }

  @Permissions(CanUpdatePoll)
  @Mutation(returns => PollAnswer, {
    description: `Deletes an existing poll answer.`,
  })
  public deletePollAnswer(@Args('id') id: string) {
    return this.service.deletePollAnswer(id);
  }

  @ResolveField(() => Int)
  async votes(@Parent() pollAnswer: PrismaFullPoll['answers'][number]) {
    return pollAnswer._count.votes;
  }
}
