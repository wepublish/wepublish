import {Module} from '@nestjs/common'
import {PeriodicJobExecutor} from './periodic-job.executor'
import {PrismaModule} from '@wepublish/nest-modules'
import {PeriodicJobController} from './periodic-job.controller'
import {SubscriptionFlowModule} from '../subscription-flow/subscription-flow.module'
import {PeriodicJobResolver} from './periodic-job.resolver'
import {PeriodicJobService} from './periodic-job.service'

@Module({
  providers: [PeriodicJobExecutor, PeriodicJobController, PeriodicJobResolver, PeriodicJobService],
  imports: [PrismaModule, SubscriptionFlowModule]
})
export class PeriodicJobModule {}
