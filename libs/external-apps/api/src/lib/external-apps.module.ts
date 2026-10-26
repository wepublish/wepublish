import { Module } from '@nestjs/common';
import { PrismaModule } from '@wepublish/nest-modules';
import { ExternalAppsResolver } from './external-apps.resolver';
import { ExternalAppsService } from './external-apps.service';
import { ExternalAppsDataloaderService } from './external-apps-dataloader.service';
import { ExternalAppsUserinfoController } from './external-apps-userinfo.controller';
import { ExternalAppApiTokenResolver } from './external-app-api-token.resolver';

@Module({
  imports: [PrismaModule],
  controllers: [ExternalAppsUserinfoController],
  providers: [
    ExternalAppsResolver,
    ExternalAppApiTokenResolver,
    ExternalAppsService,
    ExternalAppsDataloaderService,
  ],
  exports: [ExternalAppsService, ExternalAppsDataloaderService],
})
export class ExternalAppsModule {}
