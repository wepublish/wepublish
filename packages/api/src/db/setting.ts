export type Setting<T = unknown> = {
  id: string

  name: SettingName
  value: T | null
  settingRestriction?: SettingRestriction
}

export enum SettingName {
  DEFAULT = '',
  ALLOW_GUEST_COMMENTING = 'allowGuestCommenting',
  SEND_LOGIN_JWT_EXPIRES_MIN = 'sendLoginJwtExpiresMin',
  RESET_PASSWORD_JWT_EXPIRES_MIN = 'resetPasswordJwtExpiresMin',
  PEERING_TIMEOUT_MS = 'peeringTimeoutInMs'
}

export interface SettingInput<T> {
  value: T | null
}

export interface CreateSettingArgs<T> {
  name: SettingName
  value: T | null
  settingRestriction?: SettingRestriction
}

export interface UpdateSettingArgs {
  id: string
  input: SettingInput<any>
}

export interface SettingRestriction {
  maxValue?: number
  minValue?: number
  inputLength?: number
  allowedValues?: string[]
}

export type OptionalSetting = Setting | null

export interface DBSettingAdapter {
  updateSetting(args: UpdateSettingArgs): Promise<OptionalSetting>

  getSetting(name: SettingName): Promise<OptionalSetting>
  getSettingsByID(ids: readonly string[]): Promise<OptionalSetting[]>
  getSettingsByName(names: readonly SettingName[]): Promise<OptionalSetting[]>

  getSettings(): Promise<Setting[]>
}
