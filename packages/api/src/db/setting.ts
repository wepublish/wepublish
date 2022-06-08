export type Setting<T = unknown> = {
  id: string

  name: SettingName
  value: T | null
  settingRestriction?: SettingRestriction
}

export enum SettingName {
  DEFAULT = '',
  ALLOW_GUEST_COMMENTING = 'allowGuestCommenting',
  OAUTH_GOOGLE_DISCOVERY_URL = 'oathGoogleDiscoveryUrl',
  OAUTH_GOOGLE_CLIENT_ID = 'oAuthGoogleClientId',
  OAUTH_GOOGLE_CLIENT_KEY = 'oAthGoogleClientKey',
  OAUTH_GOOGLE_REDIRECT_URL = 'oAuthGoogleRedirectUrl',
  SEND_LOGIN_JWT_EXPIRES_MIN = 'sendLoginJwtExpiresMin',
  INVOICE_REMINDER_FREQ = 'invoiceReminderFreq',
  INVOICE_REMINDER_MAX_TRIES = 'invoiceReminderMaxTries',
  MONGO_LOCALE = 'mongoLocale',
  RESET_PASSWORD_JWT_EXPIRES_MIN = 'resetPasswordJwtExpiresMin',
  JWT_SECRET_KEY = 'jwtSecretKey'
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
