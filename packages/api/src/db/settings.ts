export interface Settings {
  name: string

  logoID?: string
  conanicalURL: string
  apiURL: string
  themeColor: string

  defaultImageID?: string
  defaultDescription?: string
}

export type SettingsInput = Settings

export interface DBSettingsAdapter {
  getSettings(): Promise<Settings>
  updateSettings(input: SettingsInput): Promise<Settings>
}
