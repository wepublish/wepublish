import { Module } from '@nestjs/common';
import { SettingModule } from '@wepublish/settings/api';
import { MailchimpNewsletterService } from './mailchimp-newsletter.service';
import { MailchimpNewsletterResolver } from './mailchimp-newsletter.resolver';
import { SyncProviderNewslettersResolver } from './sync-provider-newsletters.resolver';

@Module({
  imports: [SettingModule],
  providers: [
    MailchimpNewsletterService,
    MailchimpNewsletterResolver,
    SyncProviderNewslettersResolver,
  ],
  exports: [MailchimpNewsletterService],
})
export class MailchimpNewsletterModule {}
