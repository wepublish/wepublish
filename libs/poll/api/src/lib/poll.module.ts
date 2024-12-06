import {Module} from '@nestjs/common'
import {PollVoteResolver} from './poll-vote.resolver'
import {PollVoteService} from './poll-vote.service'
import {PrismaModule} from '@wepublish/nest-modules'
import {HasPollResolver} from './has-poll/has-poll.resolver'

@Module({
  imports: [PrismaModule],
  providers: [PollVoteResolver, PollVoteService, HasPollResolver]
})
export class PollModule {}
