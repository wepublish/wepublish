import {Module} from '@nestjs/common'
import {SubscriptionFlowService} from './subscription-flow.service'
import {SubscriptionFlowResolver} from './subscription-flow.resolver'
import {SubscriptionPaymentsService} from '../subscription-payments/subscription-payments.service'
import {PrismaModule} from '@wepublish/nest-modules'

@Module({
  controllers: [],
  providers: [SubscriptionFlowResolver, SubscriptionFlowService, SubscriptionPaymentsService],
  exports: [SubscriptionPaymentsService],
  imports: [PrismaModule]
})
export class SubscriptionFlowModule {}
