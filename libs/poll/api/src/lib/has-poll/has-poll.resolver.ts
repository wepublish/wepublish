import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { HasOptionalPoll, HasPoll } from './has-poll.model';
import { FullPoll } from '../poll.model';
import { PollDataloaderService } from '../poll-dataloader.service';

@Resolver(() => HasPoll)
export class HasPollResolver {
  constructor(readonly pollDataloaderService: PollDataloaderService) {}

  @ResolveField(() => FullPoll, { nullable: true })
  public poll(@Parent() { pollId }: HasOptionalPoll | HasPoll) {
    if (!pollId) {
      return null;
    }
    return this.pollDataloaderService.load(pollId);
  }
}

@Resolver(() => HasOptionalPoll)
export class HasOptionalPollResolver extends HasPollResolver {}
