import { Module } from '@nestjs/common';
import { PrismaModule } from '@wepublish/nest-modules';
import { SettingModule } from '@wepublish/settings/api';
import { MailchimpSyncService } from './mailchimp-sync.service';
import { MailchimpSyncResolver } from './mailchimp-sync.resolver';
import { ClickTrackingExtension } from './extensions/click-tracking.extension';
import { MailchimpAudienceEvidenceService } from './mailchimp-audience-evidence';
import { MailchimpCampaignClicksService } from './mailchimp-campaign-clicks';
import { MailchimpAudienceWebhookController } from './mailchimp-audience-webhook';
import { MailchimpAudienceWebhookService } from './mailchimp-audience-webhook.service';

@Module({
  imports: [PrismaModule, SettingModule],
  controllers: [MailchimpAudienceWebhookController],
  providers: [
    MailchimpSyncService,
    MailchimpSyncResolver,
    ClickTrackingExtension,
    MailchimpAudienceEvidenceService,
    MailchimpCampaignClicksService,
    MailchimpAudienceWebhookService,
  ],
  exports: [MailchimpSyncService],
})
export class MailchimpSyncModule {}
