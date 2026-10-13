import { Module } from '@nestjs/common';
import { GateModule } from '@wepublish/gate/api';
import { ImageModule } from '@wepublish/image/api';
import { BannerResolver } from './banner.resolver';

@Module({
  imports: [GateModule, ImageModule],
  providers: [BannerResolver],
})
export class BannerApiModule {}
