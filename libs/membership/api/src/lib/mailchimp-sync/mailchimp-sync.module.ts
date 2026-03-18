import { Module } from '@nestjs/common';
import { PrismaModule } from '@wepublish/nest-modules';
import { SettingModule } from '@wepublish/settings/api';
import { MailchimpSyncService } from './mailchimp-sync.service';
import { MailchimpSyncExecutor } from './mailchimp-sync.executor';
import { MailchimpSyncResolver } from './mailchimp-sync.resolver';

@Module({
  imports: [PrismaModule, SettingModule],
  providers: [
    MailchimpSyncService,
    MailchimpSyncExecutor,
    MailchimpSyncResolver,
  ],
  exports: [MailchimpSyncService],
})
export class MailchimpSyncModule {}
