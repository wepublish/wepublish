import {ContentConfig, LanguagesConfig} from '../api'
import {DefaultMetadata} from '../panel/contentMetadataPanel'

export interface ExtensionBase {
  identifier: string
}

export interface CusomExtension extends ExtensionBase {
  nameSingular: string
  namePlural: string
  view: any
}

export interface ExtensionConfig {
  contentModelExtension?: ContentModelExtension[]
  cusomExtension?: CusomExtension[]
}

export interface ContentModelExtension<M = any> extends ExtensionBase {
  defaultContent?: any
  defaultMeta?: any
  getMetaView?: (
    metadata: DefaultMetadata,
    customMetadata: M,
    onChangeMetaData: (defaultMetadata: DefaultMetadata) => void,
    onChangeCustomMetaData: (customMetadata: M) => void
  ) => any
  getContentView?: (content: any, onChange: any, disabled: any) => any
}

export type ContentModelConfigMerged = ContentConfig & Partial<ContentModelExtension>
export interface EditorConfig {
  contentModelExtension: ContentModelConfigMerged[]
  cusomExtension?: CusomExtension[]
  lang: LanguagesConfig
}
