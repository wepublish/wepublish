import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';
import { UpdateWebsiteSettingsInput } from './website-settings.model';

const CACHE_NAMESPACE = 'website-settings';
const CACHE_TTL_SECONDS = 300;

@Injectable()
export class WebsiteSettingsService {
  constructor(
    private prisma: PrismaClient,
    private kv: KvTtlCacheService
  ) {}

  async getSettings() {
    return this.kv.getOrLoadNs(
      CACHE_NAMESPACE,
      'current',
      () => this.prisma.websiteSettings.findFirst({}),
      CACHE_TTL_SECONDS
    );
  }

  async updateSettings(input: UpdateWebsiteSettingsInput) {
    const settings = await this.prisma.websiteSettings.findFirstOrThrow({});

    const updated = await this.prisma.websiteSettings.update({
      where: {
        id: settings.id,
      },
      data: {
        // Analytics
        analyticsGAEnabled:
          input.analytics?.googleAnalytics.enabled ??
          settings.analyticsGAEnabled,
        analyticsGAId: input.analytics?.googleAnalytics.key,

        analyticsGTMEnabled:
          input.analytics?.googleTagManager.enabled ??
          settings.analyticsGTMEnabled,
        analyticsGTMId: input.analytics?.googleTagManager.key,

        analyticsPAEnabled:
          input.analytics?.plausible.enabled ?? settings.analyticsPAEnabled,
        analyticsPAId: input.analytics?.plausible.key,

        analyticsPiwikEnabled:
          input.analytics?.piwik.enabled ?? settings.analyticsPiwikEnabled,
        analyticsPiwikId: input.analytics?.piwik.key,

        // Mail
        mailMailchimpEnabled:
          input.mail?.mailchimp.enabled ?? settings.mailMailchimpEnabled,
        mailMailchimpKey: input.mail?.mailchimp.key,

        // Ads
        adsSparkLoopEnabled:
          input.ads?.sparkLoop.enabled ?? settings.adsSparkLoopEnabled,
        adsSparkLoopId: input.ads?.sparkLoop.key,

        // Theme
        theme: input.theme as any,
        fonts: input.fonts as any,
      },
    });
    await this.kv.resetNamespace(CACHE_NAMESPACE);

    return updated;
  }
}
