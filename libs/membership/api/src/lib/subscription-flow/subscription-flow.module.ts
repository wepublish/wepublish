import {Module} from '@nestjs/common'
import {SubscriptionFlowService} from './subscription-flow.service'
import {SubscriptionFlowResolver} from './subscription-flow.resolver'
import {SubscriptionService} from '../subscription/subscription.service'
import {PrismaModule} from '@wepublish/nest-modules'

@Module({
  controllers: [],
  providers: [SubscriptionFlowResolver, SubscriptionFlowService, SubscriptionService],
  exports: [SubscriptionService],
  imports: [PrismaModule]
})
export class SubscriptionFlowModule {}
