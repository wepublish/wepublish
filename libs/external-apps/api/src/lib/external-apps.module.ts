import { Module } from '@nestjs/common';
import { PrismaModule } from '@wepublish/nest-modules';
import { ExternalAppsResolver } from './external-apps.resolver';
import { ExternalAppsService } from './external-apps.service';
import { ExternalAppsDataloaderService } from './external-apps-dataloader.service';
import { ExternalAppsUserinfoController } from './external-apps-userinfo.controller';

@Module({
  imports: [PrismaModule],
  controllers: [ExternalAppsUserinfoController],
  providers: [
    ExternalAppsResolver,
    ExternalAppsService,
    ExternalAppsDataloaderService,
  ],
  exports: [ExternalAppsService, ExternalAppsDataloaderService],
})
export class ExternalAppsModule {}
