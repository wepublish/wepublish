import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { UpdateWebsiteSettingsInput } from './website-settings.model';

@Injectable()
export class WebsiteSettingsService {
  constructor(private prisma: PrismaClient) {}

  async getSettings() {
    return this.prisma.websiteSettings.findFirst({});
  }

  async updateSettings(input: UpdateWebsiteSettingsInput) {
    const settings = await this.prisma.websiteSettings.findFirstOrThrow({});

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
          input.analytics?.plausible.enabled ?? settings.analyticsPiwikEnabled,
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
  }
}
