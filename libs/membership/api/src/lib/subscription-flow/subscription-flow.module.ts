import {Module} from '@nestjs/common'
import {OldContextService, PrismaService} from '@wepublish/api'
import {SubscriptionFlowController} from './subscription-flow.controller'
import {SubscriptionFlowHelper} from './subscription-flow.helper'
import {SubscriptionFlowResolver} from './subscription-flow.resolver'
import {SubscriptionController} from '../subscription/subscription.controller'

@Module({
  controllers: [],
  providers: [
    SubscriptionFlowResolver,
    PrismaService,
    SubscriptionFlowController,
    OldContextService,
    SubscriptionController,
    SubscriptionFlowHelper
  ],
  exports: [],
  imports: []
})
export class SubscriptionFlowModule {}
