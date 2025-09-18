import { applyDecorators } from '@nestjs/common';
import { OneOf } from '@wepublish/nest-modules';
import { AddMetadata } from '@wepublish/nest-modules';
import { SettingsGuard } from './settings.guard';
import { SettingName } from './setting';

export const SETTINGS_METADATA_KEY = 'settings';

/**
 * Causes the method/class to require a setting to be truthy to be called.
 * This uses the `OneOf` decorator, so if there are multiple guards attached, only one has to return true.
 */
export const Settings = (...settings: SettingName[]) =>
  applyDecorators(
    AddMetadata(SETTINGS_METADATA_KEY, settings),
    OneOf(SettingsGuard)
  );
