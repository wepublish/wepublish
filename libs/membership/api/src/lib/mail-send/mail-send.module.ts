import { Module } from '@nestjs/common';
import { PrismaModule } from '@wepublish/nest-modules';
import { SettingModule } from '@wepublish/settings/api';
import { EmailEvidenceService } from './email-evidence.service';
import { MailSendResolver } from './mail-send.resolver';
import { MailSendJobService } from './mail-send-job.service';
import { MailSendRecipientService } from './mail-send-recipient.service';
import { MailSendJobExecutor } from './mail-send-job.executor';
import { MailLogSyncService } from './mail-log-sync.service';
import { SuppressionSyncService } from './suppression-sync.service';
import { MailSendJobResolver } from './mail-send-job.resolver';
import { MailSendJobOutcomeService } from './mail-send-job-outcome.service';
import { SavedAudienceFilterResolver } from './saved-audience-filter.resolver';
import { SavedAudienceFilterService } from './saved-audience-filter.service';

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
    SuppressionSyncService,
    EmailEvidenceService,
    SavedAudienceFilterResolver,
    SavedAudienceFilterService,
  ],
  exports: [MailSendRecipientService],
})
export class MailSendModule {}
