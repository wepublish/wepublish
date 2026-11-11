import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '@wepublish/nest-modules';
import { SettingModule } from '@wepublish/settings/api';
import { EMAIL_QUALITY_RECORDER } from '@wepublish/mail/api';
import { EmailQualityService } from './email-quality.service';

/**
 * Global, so the mail, session and user libs can report evidence through the
 * {@link EMAIL_QUALITY_RECORDER} token without depending on membership.
 */
@Global()
@Module({
  imports: [PrismaModule, SettingModule],
  providers: [
    EmailQualityService,
    { provide: EMAIL_QUALITY_RECORDER, useExisting: EmailQualityService },
  ],
  exports: [EmailQualityService, EMAIL_QUALITY_RECORDER],
})
export class EmailQualityModule {}
