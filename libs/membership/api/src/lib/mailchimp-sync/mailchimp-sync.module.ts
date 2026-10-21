import { Module } from '@nestjs/common';
import { PrismaModule } from '@wepublish/nest-modules';
import { SettingModule } from '@wepublish/settings/api';
import { MailchimpSyncService } from './mailchimp-sync.service';
import { MailchimpSyncResolver } from './mailchimp-sync.resolver';
import { ClickTrackingExtension } from './extensions/click-tracking.extension';
import { MailchimpAudienceEvidenceService } from './mailchimp-audience-evidence';
import { MailchimpCampaignClicksService } from './mailchimp-campaign-clicks';

@Module({
  imports: [PrismaModule, SettingModule],
  providers: [
    MailchimpSyncService,
    MailchimpSyncResolver,
    ClickTrackingExtension,
    MailchimpAudienceEvidenceService,
    MailchimpCampaignClicksService,
  ],
  exports: [MailchimpSyncService],
})
export class MailchimpSyncModule {}
