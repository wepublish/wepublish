import {Module} from '@nestjs/common'
import {PeriodicJobExecutor} from './periodic-job.executor'
import {PrismaModule} from '@wepublish/nest-modules'
import {PeriodicJobService} from './periodic-job.service'
import {SubscriptionFlowModule} from '../subscription-flow/subscription-flow.module'

@Module({
  providers: [PeriodicJobExecutor, PeriodicJobService],
  imports: [PrismaModule, SubscriptionFlowModule]
})
export class PeriodicJobModule {}
