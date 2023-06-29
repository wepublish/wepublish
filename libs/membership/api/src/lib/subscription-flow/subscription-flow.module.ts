import {Module} from '@nestjs/common'
import {SubscriptionFlowController} from './subscription-flow.controller'
import {SubscriptionFlowHelper} from './subscription-flow.helper'
import {SubscriptionFlowResolver} from './subscription-flow.resolver'
import {SubscriptionController} from '../subscription/subscription.controller'
import {PrismaModule} from '@wepublish/nest-modules'

@Module({
  controllers: [],
  providers: [
    SubscriptionFlowResolver,
    SubscriptionFlowController,
    SubscriptionController,
    SubscriptionFlowHelper
  ],
  exports: [SubscriptionController],
  imports: [PrismaModule]
})
export class SubscriptionFlowModule {}
