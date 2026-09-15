import { Module } from '@nestjs/common';
import { PrismaModule } from '@wepublish/nest-modules';
import { SubscriptionFlowModule } from '../subscription-flow/subscription-flow.module';
import { PeriodicJobExecutor } from './periodic-job.executor';
import { PeriodicJobResolver } from './periodic-job.resolver';
import { PeriodicJobService } from './periodic-job.service';
import { PaymentsModule } from '@wepublish/payment/api';
import { SubscriptionService } from './subscription.service';
import { MailchimpSyncModule } from '../mailchimp-sync/mailchimp-sync.module';

@Module({
  imports: [
    PrismaModule,
    SubscriptionFlowModule,
    PaymentsModule,
    MailchimpSyncModule,
  ],
  providers: [
    PeriodicJobExecutor,
    PeriodicJobService,
    PeriodicJobResolver,
    SubscriptionService,
  ],
})
export class PeriodicJobModule {}
