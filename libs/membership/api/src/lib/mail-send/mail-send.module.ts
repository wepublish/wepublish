import { Module } from '@nestjs/common';
import { PrismaModule } from '@wepublish/nest-modules';
import { SettingModule } from '@wepublish/settings/api';
import { EmailEvidenceService } from './email-evidence.service';
import { MailSendResolver } from './mail-send.resolver';
import { MailSendJobService } from './mail-send-job.service';
import { MailSendRecipientService } from './mail-send-recipient.service';
import { MailSendJobExecutor } from './mail-send-job.executor';
import { MailLogSyncService } from './mail-log-sync.service';
import { MailSendJobResolver } from './mail-send-job.resolver';
import { MailSendJobOutcomeService } from './mail-send-job-outcome.service';

@Module({
  imports: [PrismaModule, SettingModule],
  providers: [
    MailSendResolver,
    MailSendJobResolver,
    MailSendJobService,
    MailSendJobOutcomeService,
    MailSendRecipientService,
    MailSendJobExecutor,
    MailLogSyncService,
    EmailEvidenceService,
  ],
  exports: [MailSendRecipientService],
})
export class MailSendModule {}
