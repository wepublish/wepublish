import {Module} from '@nestjs/common'
import {PrismaService} from '@wepublish/api'
import {SubscriptionFlowController} from './subscription-flow.controller'
import {SubscriptionFlowResolver} from './subscription-flow.resolver'

@Module({
  controllers: [],
  providers: [SubscriptionFlowResolver, PrismaService, SubscriptionFlowController],
  exports: [],
  imports: []
})
export class SubscriptionFlowModule {}
