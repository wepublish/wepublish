import { Module } from '@nestjs/common';
import { SettingsGuard } from './settings.guard';
import { PrismaModule } from '@wepublish/nest-modules';

import { SettingsResolver } from './settings.resolver';
import { SettingsService } from './settings.service';
import { GraphQLSettingValueType } from './settings.model';
import { SettingDataloaderService } from './setting-dataloader.service';

@Module({
  imports: [PrismaModule],
  providers: [
    SettingsGuard,
    SettingsResolver,
    SettingsService,
    SettingDataloaderService,
    GraphQLSettingValueType,
  ],
  exports: [SettingsGuard, SettingDataloaderService, SettingsService],
})
export class SettingModule {}
