import { Module } from '@nestjs/common';
import { PrismaModule } from '@wepublish/nest-modules';
import { KvTtlCacheModule } from '@wepublish/kv-ttl-cache/api';
import { WebsiteSettingsResolver } from './website-settings.resolver';
import { WebsiteSettingsService } from './website-settings.service';

@Module({
  imports: [PrismaModule, KvTtlCacheModule],
  providers: [WebsiteSettingsService, WebsiteSettingsResolver],
})
export class WebsiteSettingsModule {}
