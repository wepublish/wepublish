import {Module} from '@nestjs/common'
import {SubscriptionFlowSettings} from './providers/subscription-flow-settings'

@Module({
  controllers: [],
  providers: [SubscriptionFlowSettings],
  exports: []
})
export class MembershipApiModule {}
