import { Module } from '@nestjs/common';
import { SettingsGuard } from './settings.guard';
import { PrismaModule } from '@wepublish/nest-modules';

import { SettingsResolver } from './settings.resolver';
import { SettingsService } from './settings.service';
import { GraphQLSettingValueType } from './settings.model';
import { SettingDataloaderService } from './setting-dataloader.service';
import { AISettingsResolver } from './ai-settings.resolver';
import { AISettingsService } from './ai-settings.service';
import { AISettingsDataloaderService } from './ai-settings-dataloader.service';

@Module({
  imports: [PrismaModule],
  providers: [
    SettingsGuard,
    SettingsResolver,
    SettingsService,
    SettingDataloaderService,
    GraphQLSettingValueType,
    AISettingsResolver,
    AISettingsService,
    AISettingsDataloaderService,
  ],
  exports: [
    SettingsGuard,
    SettingDataloaderService,
    SettingsService,
    AISettingsService,
    AISettingsDataloaderService,
  ],
})
export class SettingModule {}
