import {Module} from '@nestjs/common'
import {SubscriptionFlowController} from './subscription-flow.controller'
import {SubscriptionFlowHelper} from './subscription-flow.helper'
import {SubscriptionFlowResolver} from './subscription-flow.resolver'
import {SubscriptionController} from '../subscription/subscription.controller'
import {OldContextService, PrismaModule, PrismaService} from '@wepublish/nest-modules'

@Module({
  controllers: [],
  providers: [
    SubscriptionFlowResolver,
    SubscriptionFlowController,
    SubscriptionController,
    SubscriptionFlowHelper,
    OldContextService,
    PrismaService
  ],
  exports: [],
  imports: [PrismaModule]
})
export class SubscriptionFlowModule {}
