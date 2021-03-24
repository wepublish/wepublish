export interface LanguageConfig {
  defaultLanguageId: string
  languages: LanguageConfigItem[]
}

export interface LanguageConfigItem {
  id: string
  tag: string // https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2 (IETF language tags)
  description: string
}
