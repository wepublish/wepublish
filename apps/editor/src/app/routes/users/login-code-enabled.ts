import { SettingName } from '@wepublish/editor/api';

/** Login codes are opt-in: only a medium that switched them on uses them. */
export const isLoginCodeEnabled = (
  settings?: { name: SettingName; value?: unknown }[]
) =>
  settings?.find(setting => setting.name === SettingName.LoginCodeEnabled)
    ?.value === true;
