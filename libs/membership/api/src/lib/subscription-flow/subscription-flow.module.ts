import {Module} from '@nestjs/common'
import {PrismaService} from '@wepublish/api'
import {SubscriptionFlowProvider} from './subscription-flow.provider'

@Module({
  controllers: [],
  providers: [SubscriptionFlowProvider, PrismaService],
  exports: [],
  imports: []
})
export class SubscriptionFlowModule {}
