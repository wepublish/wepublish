import { Module } from '@nestjs/common';
import { ImageModule } from '@wepublish/image/api';
import { GraphqlResponseCacheModule } from '@wepublish/kv-ttl-cache/api';
import { PrismaModule } from '@wepublish/nest-modules';
import { GateDataloaderService } from './gate-dataloader.service';
import { GateMemberPlansDataloader } from './gate-member-plans.dataloader';
import { GateResolver } from './gate.resolver';
import { GateService } from './gate.service';

@Module({
  imports: [GraphqlResponseCacheModule, PrismaModule, ImageModule],
  providers: [
    GateService,
    GateResolver,
    GateDataloaderService,
    GateMemberPlansDataloader,
  ],
  exports: [GateService, GateDataloaderService, GateMemberPlansDataloader],
})
export class GateModule {}
