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
import { TrackingPixelProviderSettingsResolver } from './integrations/tracking-pixel-provider-settings.resolver';
import { TrackingPixelProviderSettingsService } from './integrations/tracking-pixel-provider-settings.service';
import { TrackingPixelSettingsProviderDataloaderService } from './integrations/tracking-pixel-settings-provider-dataloader.service';
import { MailProviderSettingsResolver } from './integrations/mail-provider-settings.resolver';
import { MailProviderSettingsService } from './integrations/mail-provider-settings.service';
import { MailProviderSettingsDataloaderService } from './integrations/mail-provider-settings-dataloader.service';
import { AnalyticsProviderSettingsResolver } from './integrations/analytics-provider-settings.resolver';
import { AnalyticsProviderSettingsService } from './integrations/analytics-provider-settings.service';
import { AnalyticsProviderSettingsDataloaderService } from './integrations/analytics-provider-settings-dataloader.service';
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
    TrackingPixelProviderSettingsResolver,
    TrackingPixelProviderSettingsService,
    TrackingPixelSettingsProviderDataloaderService,
    MailProviderSettingsResolver,
    MailProviderSettingsService,
    MailProviderSettingsDataloaderService,
    AnalyticsProviderSettingsResolver,
    AnalyticsProviderSettingsService,
    AnalyticsProviderSettingsDataloaderService,
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
    TrackingPixelProviderSettingsService,
    TrackingPixelSettingsProviderDataloaderService,
    MailProviderSettingsService,
    MailProviderSettingsDataloaderService,
    AnalyticsProviderSettingsService,
    AnalyticsProviderSettingsDataloaderService,
  ],
})
export class SettingModule {}
