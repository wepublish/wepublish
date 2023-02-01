import {Module} from '@nestjs/common'
import {CommunicationFlowSettings} from './providers/communication-flow-settings'
import {PrismaService} from '@wepublish/api'

@Module({
  controllers: [],
  providers: [CommunicationFlowSettings, PrismaService],
  exports: [],
  imports: []
})
export class MembershipApiModule {}
