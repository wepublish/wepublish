import {Module} from '@nestjs/common'
import {OldContextService, PrismaService} from '@wepublish/api'
import {SubscriptionFlowController} from './subscription-flow.controller'
import {SubscriptionFlowResolver} from './subscription-flow.resolver'

@Module({
  controllers: [],
  providers: [
    SubscriptionFlowResolver,
    PrismaService,
    SubscriptionFlowController,
    OldContextService
  ],
  exports: [],
  imports: []
})
export class SubscriptionFlowModule {}
