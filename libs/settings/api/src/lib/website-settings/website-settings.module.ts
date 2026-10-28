import { Module } from '@nestjs/common';
import { PrismaModule } from '@wepublish/nest-modules';
import {
  WebsiteMailResolver,
  WebsiteSettingsResolver,
} from './website-settings.resolver';
import { WebsiteSettingsService } from './website-settings.service';

@Module({
  imports: [PrismaModule],
  providers: [
    WebsiteSettingsService,
    WebsiteSettingsResolver,
    WebsiteMailResolver,
  ],
})
export class WebsiteSettingsModule {}
