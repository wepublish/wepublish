import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import {
  CanGetSparkloopSettings,
  CanUpdateSparkloopSettings,
} from '@wepublish/permissions';
import { Permissions } from '@wepublish/permissions/api';
import { Public } from '@wepublish/authentication/api';
import {
  SettingSparkloop,
  UpdateSettingSparkloopInput,
} from './sparkloop-settings.model';
import { SparkloopSettingsService } from './sparkloop-settings.service';

@Resolver()
export class SparkloopSettingsResolver {
  constructor(private sparkloopSettingsService: SparkloopSettingsService) {}

  @Permissions(CanGetSparkloopSettings)
  @Query(returns => SettingSparkloop, {
    name: 'sparkloopSettings',
    nullable: true,
    description: 'Returns the Sparkloop settings (admin).',
  })
  sparkloopSettings() {
    return this.sparkloopSettingsService.sparkloopSettings();
  }

  @Public()
  @Query(returns => SettingSparkloop, {
    name: 'activeSparkloopSettings',
    nullable: true,
    description:
      'Returns the Sparkloop settings if active. Public; non-sensitive fields only.',
  })
  activeSparkloopSettings() {
    return this.sparkloopSettingsService.activeSparkloopSettings();
  }

  @Permissions(CanUpdateSparkloopSettings)
  @Mutation(returns => SettingSparkloop, {
    name: 'updateSparkloopSettings',
    description: 'Updates the Sparkloop settings.',
  })
  updateSparkloopSettings(@Args() input: UpdateSettingSparkloopInput) {
    return this.sparkloopSettingsService.updateSparkloopSettings(input);
  }
}
