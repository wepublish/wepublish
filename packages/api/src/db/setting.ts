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
  PEERING_TIMEOUT_MS = 'peeringTimeoutInMs',
  INVOICE_REMINDER_FREQ = 'invoiceFreqReminder',
  INVOICE_REMINDER_MAX_TRIES = 'invoiceReminderMaxTries'
}

export type SettingInput<T = unknown> = Pick<Setting<T>, 'value'>

export type CreateSettingArgs<T> = Omit<Setting<T>, 'id'>

export type UpdateSettingArgs = {
  id: string
  input: SettingInput
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
