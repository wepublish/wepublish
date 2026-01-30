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
import { ChallengeProviderSettingsResolver } from './challenge-provider-settings.resolver';
import { ChallengeProviderSettingsService } from './challenge-provider-settings.service';
import { ChallengeProviderSettingsDataloaderService } from './challenge-provider-settings-dataloader.service';
import { PaymentProviderSettingsResolver } from './payment-provider-settings.resolver';
import { PaymentProviderSettingsService } from './payment-provider-settings.service';
import { PaymentProviderSettingsDataloaderService } from './payment-provider-settings-dataloader.service';
import { TrackingPixelSettingsResolver } from './tracking-pixel-settings.resolver';
import { TrackingPixelSettingsService } from './tracking-pixel-settings.service';
import { TrackingPixelSettingsDataloaderService } from './tracking-pixel-settings-dataloader.service';
import { MailProviderSettingsResolver } from './mail-provider-settings.resolver';
import { MailProviderSettingsService } from './mail-provider-settings.service';
import { MailProviderSettingsDataloaderService } from './mail-provider-settings-dataloader.service';

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
    ChallengeProviderSettingsResolver,
    ChallengeProviderSettingsService,
    ChallengeProviderSettingsDataloaderService,
    PaymentProviderSettingsResolver,
    PaymentProviderSettingsService,
    PaymentProviderSettingsDataloaderService,
    TrackingPixelSettingsResolver,
    TrackingPixelSettingsService,
    TrackingPixelSettingsDataloaderService,
    MailProviderSettingsResolver,
    MailProviderSettingsService,
    MailProviderSettingsDataloaderService,
  ],
  exports: [
    SettingsGuard,
    SettingDataloaderService,
    SettingsService,
    AISettingsService,
    AISettingsDataloaderService,
    ChallengeProviderSettingsService,
    ChallengeProviderSettingsDataloaderService,
    PaymentProviderSettingsService,
    PaymentProviderSettingsDataloaderService,
    TrackingPixelSettingsService,
    TrackingPixelSettingsDataloaderService,
    MailProviderSettingsService,
    MailProviderSettingsDataloaderService,
  ],
})
export class SettingModule {}
