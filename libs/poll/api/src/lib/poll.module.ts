import {Module} from '@nestjs/common'
import {PollVoteResolver} from './poll-vote.resolver'
import {PollVoteService} from './poll-vote.service'
import {PrismaModule} from '@wepublish/nest-modules'

@Module({
  imports: [PrismaModule],
  providers: [PollVoteResolver, PollVoteService]
})
export class PollModule {}
