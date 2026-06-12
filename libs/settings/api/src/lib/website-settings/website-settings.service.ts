import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { UpdateWebsiteSettingsInput } from './website-settings.model';

const DEFAULT_WEBSITE_SETTINGS_ID = 'default';

@Injectable()
export class WebsiteSettingsService {
  constructor(private prisma: PrismaClient) {}

  async getSettings() {
    return this.getOrCreateSettings();
  }

  async updateSettings(input: UpdateWebsiteSettingsInput) {
    const settings = await this.getOrCreateSettings();

    return this.prisma.websiteSettings.update({
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

        // Ads
        adsSparkLoopEnabled:
          input.ads?.sparkLoop.enabled ?? settings.adsSparkLoopEnabled,
        adsSparkLoopId: input.ads?.sparkLoop.key,

        // Theme
        theme: input.theme as any,
        fonts: input.fonts as any,
      },
    });
  }

  private async getOrCreateSettings() {
    const settings = await this.prisma.websiteSettings.findFirst({
      orderBy: { createdAt: 'asc' },
    });

    if (settings) {
      return settings;
    }

    return this.prisma.websiteSettings.create({
      data: { id: DEFAULT_WEBSITE_SETTINGS_ID },
    });
  }
}
