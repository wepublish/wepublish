export type Setting<T = unknown> = {
  id: string

  name: string
  value: T | null
  settingRestriction?: SettingRestriction
}

export interface SettingInput<T> {
  name: string
  value: T | null
}

export interface CreateSettingArgs<T> {
  name: string
  value: T | null
  settingRestriction?: SettingRestriction
}

export interface UpdateSettingArgs {
  id: string
  input: SettingInput<any>
}

export interface DeleteSettingArgs {
  id: string
}

export interface SettingRestriction {
  maxValue?: number
  minValue?: number
  inputLength?: number
  allowedValues?: string[]
}

export type OptionalSetting = Setting | null

export interface DBSettingAdapter {
  createSetting(args: CreateSettingArgs<any>): Promise<Setting>
  updateSetting(args: UpdateSettingArgs): Promise<OptionalSetting>
  deleteSetting(args: DeleteSettingArgs): Promise<string | null>

  getSettingsByID(ids: readonly string[]): Promise<OptionalSetting[]>
  getSettingsByName(names: readonly string[]): Promise<OptionalSetting[]>

  getSettings(): Promise<Setting[]>
}
