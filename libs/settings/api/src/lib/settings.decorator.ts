import {applyDecorators} from '@nestjs/common'
import {OneOf} from '@wepublish/authentication/api'
import {AddMetadata} from '@wepublish/nest-modules'
import {SettingsGuard} from './settings.guard'
import {SettingName} from './setting'

export const SETTINGS_METADATA_KEY = 'settings'

export const Settings = (...settings: SettingName[]) =>
  applyDecorators(AddMetadata(SETTINGS_METADATA_KEY, settings), OneOf(SettingsGuard))
