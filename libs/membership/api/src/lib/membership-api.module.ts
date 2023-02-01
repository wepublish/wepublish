import {Module} from '@nestjs/common'
import {SubscriptionFlowSettings} from './providers/subscription-flow-settings'
import {PrismaService} from '@wepublish/api'

@Module({
  controllers: [],
  providers: [SubscriptionFlowSettings, PrismaService],
  exports: [],
  imports: []
})
export class MembershipApiModule {}
