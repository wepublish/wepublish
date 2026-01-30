import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import {
  CanGetTrackingPixelSettings,
  CanUpdateTrackingPixelSettings,
  CanCreateTrackingPixelSettings,
  CanDeleteTrackingPixelSettings,
} from '@wepublish/permissions';
import { Permissions } from '@wepublish/permissions/api';
import {
  SettingTrackingPixel,
  CreateSettingTrackingPixelInput,
  UpdateSettingTrackingPixelInput,
  SettingTrackingPixelFilter,
} from './tracking-pixel-settings.model';
import { TrackingPixelSettingsService } from './tracking-pixel-settings.service';
import { TrackingPixelSettingsDataloaderService } from './tracking-pixel-settings-dataloader.service';

@Resolver()
export class TrackingPixelSettingsResolver {
  constructor(
    private trackingPixelSettingsService: TrackingPixelSettingsService,
    private trackingPixelSettingsDataloader: TrackingPixelSettingsDataloaderService
  ) {}

  @Permissions(CanGetTrackingPixelSettings)
  @Query(returns => [SettingTrackingPixel], {
    name: 'trackingPixelSettings',
    description: 'Returns all tracking pixel settings.',
  })
  trackingPixelSettings(
    @Args('filter', { nullable: true }) filter?: SettingTrackingPixelFilter
  ) {
    return this.trackingPixelSettingsService.trackingPixelSettingsList(filter);
  }

  @Permissions(CanGetTrackingPixelSettings)
  @Query(returns => SettingTrackingPixel, {
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
  @Mutation(returns => SettingTrackingPixel, {
    name: 'updateTrackingPixelSetting',
    description: 'Updates an existing tracking pixel setting.',
  })
  updateTrackingPixelSetting(@Args() input: UpdateSettingTrackingPixelInput) {
    return this.trackingPixelSettingsService.updateTrackingPixelSetting(input);
  }

  @Permissions(CanDeleteTrackingPixelSettings)
  @Mutation(returns => SettingTrackingPixel, {
    name: 'deleteTrackingPixelSetting',
    description: 'Deletes a tracking pixel setting.',
  })
  deleteTrackingPixelSetting(@Args('id') id: string) {
    return this.trackingPixelSettingsService.deleteTrackingPixelSetting(id);
  }
}
