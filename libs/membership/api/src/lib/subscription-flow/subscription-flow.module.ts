import {Module} from '@nestjs/common'
import {PrismaService} from '@wepublish/api'
import {SubscriptionFlowController} from './subscription-flow.controller'
import {SubscriptionFlowProvider} from './subscription-flow.provider'

@Module({
  controllers: [],
  providers: [SubscriptionFlowProvider, PrismaService, SubscriptionFlowController],
  exports: [],
  imports: []
})
export class SubscriptionFlowModule {}
