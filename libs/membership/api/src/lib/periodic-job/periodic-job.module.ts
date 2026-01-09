import { Module } from '@nestjs/common';
import { PrismaModule } from '@wepublish/nest-modules';
import { SubscriptionFlowModule } from '../subscription-flow/subscription-flow.module';
import { PeriodicJobExecutor } from './periodic-job.executor';
import { PeriodicJobResolver } from './periodic-job.resolver';
import { PeriodicJobService } from './periodic-job.service';
import { PaymentsModule } from '@wepublish/payment/api';

@Module({
  providers: [PeriodicJobExecutor, PeriodicJobService, PeriodicJobResolver],
  imports: [PrismaModule, SubscriptionFlowModule, PaymentsModule],
})
export class PeriodicJobModule {}
