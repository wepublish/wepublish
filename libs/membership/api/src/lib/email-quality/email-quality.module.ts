import { Module } from '@nestjs/common';
import { PrismaModule } from '@wepublish/nest-modules';
import { SettingModule } from '@wepublish/settings/api';
import { EmailQualityService } from './email-quality.service';

@Module({
  imports: [PrismaModule, SettingModule],
  providers: [EmailQualityService],
  exports: [EmailQualityService],
})
export class EmailQualityModule {}
