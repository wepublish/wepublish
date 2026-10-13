import { Module } from '@nestjs/common';
import { PrismaModule } from '@wepublish/nest-modules';
import { SettingModule } from '@wepublish/settings/api';
import { MailchimpContactService } from './mailchimp-contact.service';

@Module({
  imports: [PrismaModule, SettingModule],
  providers: [MailchimpContactService],
  exports: [MailchimpContactService],
})
export class MailchimpContactModule {}
