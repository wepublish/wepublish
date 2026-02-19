import { Module } from '@nestjs/common';
import { SettingsGuard } from './settings.guard';
import { PrismaModule } from '@wepublish/nest-modules';

import { SettingsResolver } from './settings.resolver';
import { SettingsService } from './settings.service';
import { GraphQLSettingValueType } from './settings.model';
import { SettingDataloaderService } from './setting-dataloader.service';
import { AISettingsResolver } from './integrations/ai-settings.resolver';
import { AISettingsService } from './integrations/ai-settings.service';
import { AISettingsDataloaderService } from './integrations/ai-settings-dataloader.service';
import { ChallengeProviderSettingsResolver } from './integrations/challenge-provider-settings.resolver';
import { ChallengeProviderSettingsService } from './integrations/challenge-provider-settings.service';
import { ChallengeProviderSettingsDataloaderService } from './integrations/challenge-provider-settings-dataloader.service';
import { PaymentProviderSettingsResolver } from './integrations/payment-provider-settings.resolver';
import { PaymentProviderSettingsService } from './integrations/payment-provider-settings.service';
import { PaymentProviderSettingsDataloaderService } from './integrations/payment-provider-settings-dataloader.service';
import { TrackingPixelSettingsResolver } from './tracking-pixel-settings.resolver';
import { TrackingPixelSettingsService } from './tracking-pixel-settings.service';
import { TrackingPixelSettingsDataloaderService } from './tracking-pixel-settings-dataloader.service';
import { MailProviderSettingsResolver } from './integrations/mail-provider-settings.resolver';
import { MailProviderSettingsService } from './integrations/mail-provider-settings.service';
import { MailProviderSettingsDataloaderService } from './integrations/mail-provider-settings-dataloader.service';
import { KvTtlCacheModule } from '@wepublish/kv-ttl-cache/api';

@Module({
  imports: [PrismaModule, KvTtlCacheModule],
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
