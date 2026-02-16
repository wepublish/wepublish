import { Module } from '@nestjs/common';
import { PrismaModule } from '@wepublish/nest-modules';
import { ExternalAppsResolver } from './external-apps.resolver';
import { ExternalAppsService } from './external-apps.service';
import { ExternalAppsDataloaderService } from './external-apps-dataloader.service';

@Module({
  imports: [PrismaModule],
  providers: [
    ExternalAppsResolver,
    ExternalAppsService,
    ExternalAppsDataloaderService,
  ],
  exports: [ExternalAppsService, ExternalAppsDataloaderService],
})
export class ExternalAppsModule {}
