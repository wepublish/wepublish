import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import {
  CanGetAnalyticsProviderSettings,
  CanUpdateAnalyticsProviderSettings,
  CanCreateAnalyticsProviderSettings,
  CanDeleteAnalyticsProviderSettings,
} from '@wepublish/permissions';
import { Permissions } from '@wepublish/permissions/api';
import {
  SettingAnalyticsProvider,
  UpdateSettingAnalyticsProviderInput,
  SettingAnalyticsProviderFilter,
  CreateSettingAnalyticsProviderInput,
} from './analytics-provider-settings.model';
import { AnalyticsProviderSettingsService } from './analytics-provider-settings.service';
import { AnalyticsProviderSettingsDataloaderService } from './analytics-provider-settings-dataloader.service';

@Resolver()
export class AnalyticsProviderSettingsResolver {
  constructor(
    private analyticsProviderSettingsService: AnalyticsProviderSettingsService,
    private analyticsProviderSettingsDataloader: AnalyticsProviderSettingsDataloaderService
  ) {}

  @Permissions(CanGetAnalyticsProviderSettings)
  @Query(returns => [SettingAnalyticsProvider], {
    name: 'analyticsProviderSettings',
    description: 'Returns all analytics provider settings.',
  })
  analyticsProviderSettings(
    @Args('filter', { nullable: true }) filter?: SettingAnalyticsProviderFilter
  ) {
    return this.analyticsProviderSettingsService.analyticsProviderSettingsList(
      filter
    );
  }

  @Permissions(CanGetAnalyticsProviderSettings)
  @Query(returns => SettingAnalyticsProvider, {
    name: 'analyticsProviderSetting',
    description: 'Returns a single analytics provider setting by id.',
  })
  analyticsProviderSetting(@Args('id') id: string) {
    return this.analyticsProviderSettingsDataloader.load(id);
  }

  /**
  @Permissions(CanCreateAnalyticsProviderSettings)
  @Mutation(returns => SettingAnalyticsProvider, {
    name: 'createAnalyticsProviderSetting',
    description: 'Creates a new analytics provider setting.',
  })
  createAnalyticsProviderSetting(@Args() input: CreateSettingAnalyticsProviderInput) {
    return this.analyticsProviderSettingsService.createAnalyticsProviderSetting(input);
  }
   **/

  @Permissions(CanUpdateAnalyticsProviderSettings)
  @Mutation(returns => SettingAnalyticsProvider, {
    name: 'updateAnalyticsProviderSetting',
    description: 'Updates an existing analytics provider setting.',
  })
  updateAnalyticsProviderSetting(
    @Args() input: UpdateSettingAnalyticsProviderInput
  ) {
    return this.analyticsProviderSettingsService.updateAnalyticsProviderSetting(
      input
    );
  }

  /**
  @Permissions(CanDeleteAnalyticsProviderSettings)
  @Mutation(returns => SettingAnalyticsProvider, {
    name: 'deleteAnalyticsProviderSetting',
    description: 'Deletes an analytics provider setting.',
  })
  deleteAnalyticsProviderSetting(@Args('id') id: string) {
    return this.analyticsProviderSettingsService.deleteAnalyticsProviderSetting(id);
  }
    **/
}
