import { Module } from '@nestjs/common';
import { BannerResolver } from './banner.resolver';
import { BannerService } from './banner.service';
import { PrismaModule } from '@wepublish/nest-modules';
import { BannerActionService } from './banner-action.service';
import { ImageModule } from '@wepublish/image/api';

@Module({
  imports: [PrismaModule, ImageModule],
  providers: [BannerResolver, BannerService, BannerActionService],
})
export class BannerApiModule {}
