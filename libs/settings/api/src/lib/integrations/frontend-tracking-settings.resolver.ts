import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import {
  CanGetFrontendTrackingSettings,
  CanUpdateFrontendTrackingSettings,
} from '@wepublish/permissions';
import { Permissions } from '@wepublish/permissions/api';
import { Public } from '@wepublish/authentication/api';
import {
  SettingFrontendTracking,
  SettingFrontendTrackingFilter,
  UpdateSettingFrontendTrackingInput,
} from './frontend-tracking-settings.model';
import { FrontendTrackingSettingsService } from './frontend-tracking-settings.service';

@Resolver()
export class FrontendTrackingSettingsResolver {
  constructor(
    private frontendTrackingSettingsService: FrontendTrackingSettingsService
  ) {}

  @Permissions(CanGetFrontendTrackingSettings)
  @Query(returns => [SettingFrontendTracking], {
    name: 'frontendTrackingSettings',
    description: 'Returns all frontend tracking settings.',
  })
  frontendTrackingSettings(
    @Args('filter', { nullable: true }) filter?: SettingFrontendTrackingFilter
  ) {
    return this.frontendTrackingSettingsService.frontendTrackingSettingsList(
      filter
    );
  }

  @Permissions(CanGetFrontendTrackingSettings)
  @Query(returns => SettingFrontendTracking, {
    name: 'frontendTrackingSetting',
    description: 'Returns a single frontend tracking setting by id.',
  })
  frontendTrackingSetting(@Args('id') id: string) {
    return this.frontendTrackingSettingsService.frontendTrackingSetting(id);
  }

  @Public()
  @Query(returns => [SettingFrontendTracking], {
    name: 'activeFrontendTrackingProviders',
    description:
      'Returns all active frontend tracking providers. Public; non-sensitive fields only.',
  })
  activeFrontendTrackingProviders() {
    return this.frontendTrackingSettingsService.activeFrontendTrackingProviders();
  }

  @Permissions(CanUpdateFrontendTrackingSettings)
  @Mutation(returns => SettingFrontendTracking, {
    name: 'updateFrontendTrackingSetting',
    description: 'Updates an existing frontend tracking setting.',
  })
  updateFrontendTrackingSetting(
    @Args() input: UpdateSettingFrontendTrackingInput
  ) {
    return this.frontendTrackingSettingsService.updateFrontendTrackingSetting(
      input
    );
  }
}
