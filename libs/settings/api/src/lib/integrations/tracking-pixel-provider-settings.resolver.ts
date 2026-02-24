import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import {
  CanGetTrackingPixelSettings,
  CanUpdateTrackingPixelSettings,
} from '@wepublish/permissions';
import { Permissions } from '@wepublish/permissions/api';
import {
  SettingTrackingPixelProvider,
  UpdateSettingTrackingPixelProviderInput,
  SettingTrackingPixelFilter,
} from './tracking-pixel-provider-settings.model';
import { TrackingPixelProviderSettingsService } from './tracking-pixel-provider-settings.service';
import { TrackingPixelSettingsProviderDataloaderService } from './tracking-pixel-settings-provider-dataloader.service';

@Resolver()
export class TrackingPixelProviderSettingsResolver {
  constructor(
    private trackingPixelSettingsService: TrackingPixelProviderSettingsService,
    private trackingPixelSettingsDataloader: TrackingPixelSettingsProviderDataloaderService
  ) {}

  @Permissions(CanGetTrackingPixelSettings)
  @Query(returns => [SettingTrackingPixelProvider], {
    name: 'trackingPixelSettings',
    description: 'Returns all tracking pixel settings.',
  })
  trackingPixelSettings(
    @Args('filter', { nullable: true }) filter?: SettingTrackingPixelFilter
  ) {
    return this.trackingPixelSettingsService.trackingPixelSettingsList(filter);
  }

  @Permissions(CanGetTrackingPixelSettings)
  @Query(returns => SettingTrackingPixelProvider, {
    name: 'trackingPixelSetting',
    description: 'Returns a single tracking pixel setting by id.',
  })
  trackingPixelSetting(@Args('id') id: string) {
    return this.trackingPixelSettingsDataloader.load(id);
  }

  /** DISABLE FOR NOW
  @Permissions(CanCreateTrackingPixelSettings)
  @Mutation(returns => SettingTrackingPixel, {
    name: 'createTrackingPixelSetting',
    description: 'Creates a new tracking pixel setting.',
  })
  createTrackingPixelSetting(@Args('input') input: CreateSettingTrackingPixelInput) {
    return this.trackingPixelSettingsService.createTrackingPixelSetting(input);
  }
 **/

  @Permissions(CanUpdateTrackingPixelSettings)
  @Mutation(returns => SettingTrackingPixelProvider, {
    name: 'updateTrackingPixelSetting',
    description: 'Updates an existing tracking pixel setting.',
  })
  updateTrackingPixelSetting(
    @Args() input: UpdateSettingTrackingPixelProviderInput
  ) {
    return this.trackingPixelSettingsService.updateTrackingPixelSetting(input);
  }

  /** DISABLE FOR NOW
  @Permissions(CanDeleteTrackingPixelSettings)
  @Mutation(returns => SettingTrackingPixel, {
    name: 'deleteTrackingPixelSetting',
    description: 'Deletes a tracking pixel setting.',
  })
  deleteTrackingPixelSetting(@Args('id') id: string) {
    return this.trackingPixelSettingsService.deleteTrackingPixelSetting(id);
  }
    **/
}
