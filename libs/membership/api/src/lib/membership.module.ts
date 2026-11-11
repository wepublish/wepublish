import { Module } from '@nestjs/common';
import { SubscriptionFlowModule } from './subscription-flow/subscription-flow.module';
import { MailTemplateModule } from './mail-template/mail-template.module';
import { DeliveryModeModule } from './delivery-mode/delivery-mode.module';
import { MailSendModule } from './mail-send/mail-send.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { SystemMailModule } from './system-mail/system-mail.module';
import { PeriodicJobModule } from './periodic-job/periodic-job.module';
import { MemberContextModule } from './legacy/member-context.module';
import { MailchimpSyncModule } from './mailchimp-sync/mailchimp-sync.module';
import { EmailQualityModule } from './email-quality/email-quality.module';
import { ActionMailModule } from './action-mail/action-mail.module';
import { PaymentMethodChangeModule } from './payment-method-change/payment-method-change.module';

@Module({
  imports: [
    SubscriptionFlowModule,
    MailTemplateModule,
    MailSendModule,
    DeliveryModeModule,
    DashboardModule,
    SystemMailModule,
    PeriodicJobModule,
    MemberContextModule,
    MailchimpSyncModule,
    EmailQualityModule,
    ActionMailModule,
    PaymentMethodChangeModule,
  ],
})
export class MembershipModule {}
