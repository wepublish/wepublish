import {
  Args,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import {
  AuthToken,
  CurrentUser,
  Public,
  SCOPED_JWT_METADATA_KEY,
  ScopedJwtVerifier,
  UserSession,
} from '@wepublish/authentication/api';
import { WebsiteSettingsService } from './website-settings.service';
import { WebsiteSettings as PWebsiteSettings } from '@prisma/client';
import {
  WebsiteSettings,
  UpdateWebsiteSettingsInput,
  WebsiteAnalytics,
  WebsiteMail,
  WebsiteAds,
} from './website-settings.model';
import { hasPermission, Permissions } from '@wepublish/permissions/api';
import {
  CanGetWebsiteSettings,
  CanUpdateWebsiteSettings,
} from '@wepublish/permissions';
import { Inject } from '@nestjs/common';

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
    };
  }

  @ResolveField(() => WebsiteAnalytics)
  mail(@Parent() parent: PWebsiteSettings): WebsiteMail {
    return {
      mailchimp: {
        enabled: parent.mailMailchimpEnabled,
        key: parent.mailMailchimpKey ?? undefined,
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

@Resolver(() => WebsiteMail)
export class WebsiteMailResolver {
  constructor(
    @Inject(SCOPED_JWT_METADATA_KEY)
    private jwt: ScopedJwtVerifier
  ) {}

  @ResolveField(() => WebsiteAnalytics, { nullable: true })
  mailchimp(
    @Parent() parent: WebsiteMail,
    @CurrentUser() session: UserSession | null,
    @AuthToken() authToken: string | null
  ) {
    const hasPerms =
      hasPermission(CanGetWebsiteSettings, session?.roles ?? []) ||
      this.jwt.verifyScopedJWT(authToken ?? '', 'read:website-settings');

    if (!hasPerms) {
      return null;
    }

    return parent.mailchimp;
  }
}
