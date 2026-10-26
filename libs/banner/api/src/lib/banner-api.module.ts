import { Module } from '@nestjs/common';
import { EngagementModule } from '@wepublish/engagement/api';
import { ImageModule } from '@wepublish/image/api';
import { BannerResolver } from './banner.resolver';

@Module({
  imports: [EngagementModule, ImageModule],
  providers: [BannerResolver],
})
export class BannerApiModule {}
