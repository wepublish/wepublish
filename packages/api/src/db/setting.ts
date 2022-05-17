export enum SettingType {
  Switch = 'switch',
  MultiSelect = 'multiSelect',
  Input = 'input',
  Number = 'number'
}

export type Setting<T = unknown> = {
  id: string

  name: string
  settingType: SettingType
  value: T | null
}

export interface SettingInput<T> {
  name: string
  type: SettingType
  value: T | null
}

export interface CreateSettingArgs<T> {
  input: SettingInput<T>
}

export interface UpdateSettingArgs {
  id: string
  input: SettingInput<any>
}

export interface DeleteSettingArgs {
  id: string
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
