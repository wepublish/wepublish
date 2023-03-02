import {Module} from '@nestjs/common'
import {OldContextService, PrismaService} from '@wepublish/api'
import {SubscriptionFlowController} from './subscription-flow.controller'
import {SubscriptionFlowResolver} from './subscription-flow.resolver'
import {PeriodicJobController} from '../periodic-job/periodic-job.controller'

@Module({
  controllers: [],
  providers: [
    SubscriptionFlowResolver,
    PrismaService,
    SubscriptionFlowController,
    OldContextService,
    PeriodicJobController
  ],
  exports: [],
  imports: []
})
export class SubscriptionFlowModule {}
