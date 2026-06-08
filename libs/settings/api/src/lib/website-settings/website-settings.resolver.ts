import {
  Args,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { Public } from '@wepublish/authentication/api';
import { WebsiteSettingsService } from './website-settings.service';
import { WebsiteSettings as PWebsiteSettings } from '@prisma/client';
import {
  WebsiteSettings,
  UpdateWebsiteSettingsInput,
  WebsiteAnalytics,
  WebsiteAds,
} from './website-settings.model';
import { Permissions } from '@wepublish/permissions/api';
import { CanUpdateWebsiteSettings } from '@wepublish/permissions';

@Resolver(() => WebsiteSettings)
export class WebsiteSettingsResolver {
  constructor(private websiteSettingsService: WebsiteSettingsService) {}

  @Public()
  @Query(() => WebsiteSettings, {
    description: `Returns the website settings, requires authentication to get sensitive settings.`,
  })
  public async websiteSettings() {
    return this.websiteSettingsService.getSettings();
  }

  @Permissions(CanUpdateWebsiteSettings)
  @Mutation(returns => WebsiteSettings, {
    description: `Updates the website settings.`,
  })
  public updateWebsiteSettings(
    @Args() websitesettings: UpdateWebsiteSettingsInput
  ) {
    return this.websiteSettingsService.updateSettings(websitesettings);
  }

  @ResolveField(() => WebsiteAnalytics)
  analytics(@Parent() parent: PWebsiteSettings): WebsiteAnalytics {
    return {
      googleAnalytics: {
        enabled: parent.analyticsGAEnabled,
        key: parent.analyticsGAId ?? undefined,
      },
      googleTagManager: {
        enabled: parent.analyticsGTMEnabled,
        key: parent.analyticsGTMId ?? undefined,
      },
      plausible: {
        enabled: parent.analyticsPAEnabled,
        key: parent.analyticsPAId ?? undefined,
      },
      piwik: {
        enabled: parent.analyticsPiwikEnabled,
        key: parent.analyticsPiwikId ?? undefined,
      },
    };
  }

  @ResolveField(() => WebsiteAnalytics)
  ads(@Parent() parent: PWebsiteSettings): WebsiteAds {
    return {
      sparkLoop: {
        enabled: parent.adsSparkLoopEnabled,
        key: parent.adsSparkLoopId ?? undefined,
      },
    };
  }
}
