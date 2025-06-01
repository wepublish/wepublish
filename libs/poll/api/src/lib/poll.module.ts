import {Module} from '@nestjs/common'
import {PollVoteResolver} from './poll-vote.resolver'
import {PollVoteService} from './poll-vote.service'
import {PrismaModule} from '@wepublish/nest-modules'
import {HasOptionalPollResolver, HasPollResolver} from './has-poll/has-poll.resolver'
import {PollAnswerWithVoteCountResolver, PollResolver} from './poll.resolver'
import {PollDataloaderService} from './poll-dataloader.service'

@Module({
  imports: [PrismaModule],
  providers: [
    PollVoteResolver,
    PollVoteService,
    HasPollResolver,
    HasOptionalPollResolver,
    PollResolver,
    PollAnswerWithVoteCountResolver,
    PollDataloaderService
  ],
  exports: [PollDataloaderService]
})
export class PollModule {}
