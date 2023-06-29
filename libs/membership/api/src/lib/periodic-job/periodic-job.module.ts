import {Module} from '@nestjs/common'
import {PeriodicJobExecutor} from './periodic-job.executor'
import {PrismaModule} from '@wepublish/nest-modules'
import {PeriodicJobController} from './periodic-job.controller'
import {SubscriptionFlowModule} from '../subscription-flow/subscription-flow.module'

@Module({
  providers: [PeriodicJobExecutor, PeriodicJobController],
  imports: [PrismaModule, SubscriptionFlowModule]
})
export class PeriodicJobModule {}
