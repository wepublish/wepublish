import { Module } from '@nestjs/common';
import { SubscriptionFlowModule } from './subscription-flow/subscription-flow.module';
import { MailTemplateModule } from './mail-template/mail-template.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { SystemMailModule } from './system-mail/system-mail.module';
import { PeriodicJobModule } from './periodic-job/periodic-job.module';
import { MemberContextModule } from './legacy/member-context.module';

@Module({
  imports: [
    SubscriptionFlowModule,
    MailTemplateModule,
    DashboardModule,
    SystemMailModule,
    PeriodicJobModule,
    MemberContextModule,
  ],
})
export class MembershipModule {}
