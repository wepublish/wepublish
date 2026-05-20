import { Module } from '@nestjs/common';
import { PrismaModule } from '@wepublish/nest-modules';
import { WebsiteSettingsResolver } from './website-settings.resolver';
import { WebsiteSettingsService } from './website-settings.service';

@Module({
  imports: [PrismaModule],
  providers: [WebsiteSettingsService, WebsiteSettingsResolver],
})
export class WebsiteSettingsModule {}
