import {ContentModelConfig} from '../api'

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

export interface ContentModelExtension extends ExtensionBase {
  defaultContent?: any
  getMetaView?: (metadata: any, onClose: any, onChange: any) => any
  getContentView?: (content: any, handleChange: any, disabled: any) => any
  mapStateToInput?: (obj: any) => any
}

export type ContentModelConfigMerged = ContentModelConfig & Partial<ContentModelExtension>
export interface ConfigMerged {
  contentModelExtension: ContentModelConfigMerged[]
  cusomExtension?: CusomExtension[]
}
