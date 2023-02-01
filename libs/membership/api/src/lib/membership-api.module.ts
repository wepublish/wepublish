import {Module} from '@nestjs/common'
import {CommunicationFlowSettings} from './providers/communication-flow-settings'

@Module({
  controllers: [],
  providers: [CommunicationFlowSettings],
  exports: []
})
export class MembershipApiModule {}
