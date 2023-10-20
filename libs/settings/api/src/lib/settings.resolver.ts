import {Args, Mutation, Query, Resolver} from '@nestjs/graphql'
import {CanGetSettings, CanUpdateSettings, Permissions} from '@wepublish/permissions/api'
import {Setting, UpdateSettingInput, SettingFilter} from './settings.model'
import {SettingsService} from './settings.service'

@Resolver()
export class SettingsResolver {
  constructor(private settingsService: SettingsService) {}

  /*
  Queries
 */
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
    name: 'setting',
    description: `
      Returns a single setting by id.
    `
  })
  @Permissions(CanGetSettings)
  setting(@Args('id') id: string) {
    return this.settingsService.setting(id)
  }

  /*
  Mutations
 */
  @Mutation(returns => [Setting], {
    name: 'updateSettings',
    description: `
      Updates an existing settings.
    `
  })
  @Permissions(CanUpdateSettings)
  updateSettings(@Args('value', {type: () => [UpdateSettingInput]}) value: [UpdateSettingInput]) {
    return this.settingsService.updateSettings({value})
  }
}
