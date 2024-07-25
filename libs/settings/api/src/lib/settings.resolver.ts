import {Args, Mutation, Query, Resolver} from '@nestjs/graphql'
import {CanGetSettings, CanUpdateSettings, Permissions} from '@wepublish/permissions/api'
import {Setting, UpdateSettingInput, SettingFilter} from './settings.model'
import {SettingsService} from './settings.service'

@Resolver()
export class SettingsResolver {
  constructor(private settingsService: SettingsService) {}

  @Query(returns => [Setting], {
    name: 'settingsList',
    description: `
      Returns all settings.
    `
  })
  @Permissions(CanGetSettings)
  settingsList(@Args('filter', {nullable: true}) filter?: SettingFilter) {
    return this.settingsService.settingsList(filter)
  }

  @Query(returns => Setting, {
    name: 'settingById',
    description: `
      Returns a single setting by id.
    `
  })
  @Permissions(CanGetSettings)
  settingById(@Args('id') id: string) {
    return this.settingsService.setting(id)
  }

  @Mutation(returns => Setting, {
    name: 'updateSetting',
    description: 'Updates an existing setting.'
  })
  @Permissions(CanUpdateSettings)
  updateSetting(@Args() input: UpdateSettingInput) {
    return this.settingsService.updateSetting(input)
  }
}
