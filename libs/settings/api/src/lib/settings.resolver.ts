import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CanGetSettings, CanUpdateSettings } from '@wepublish/permissions';
import { Permissions } from '@wepublish/permissions/api';
import { Public } from '@wepublish/authentication/api';
import { Setting, UpdateSettingInput, SettingFilter } from './settings.model';
import { SettingsService } from './settings.service';
import { SettingDataloaderService } from './setting-dataloader.service';

@Resolver()
export class SettingsResolver {
  constructor(
    private settingsService: SettingsService,
    private settingsDataloader: SettingDataloaderService
  ) {}

  @Public()
  @Query(returns => [Setting], {
    name: 'settings',
    description: `
      Returns all settings.
    `,
  })
  settings(@Args('filter', { nullable: true }) filter?: SettingFilter) {
    return this.settingsService.settingsList(filter);
  }

  @Public()
  @Query(returns => Setting, {
    name: 'setting',
    description: `
      Returns a single setting by name.
    `,
  })
  setting(@Args('name') name: string) {
    return this.settingsDataloader.load(name);
  }

  @Permissions(CanGetSettings)
  @Permissions(CanGetSettings)
  @Query(returns => Setting, {
    name: 'settingById',
    description: `
      Returns a single setting by id.
    `,
  })
  settingById(@Args('id') id: string) {
    return this.settingsService.setting(id);
  }

  @Permissions(CanUpdateSettings)
  @Permissions(CanUpdateSettings)
  @Mutation(returns => Setting, {
    name: 'updateSetting',
    description: 'Updates an existing setting.',
  })
  updateSetting(@Args() input: UpdateSettingInput) {
    return this.settingsService.updateSetting(input);
  }
}
