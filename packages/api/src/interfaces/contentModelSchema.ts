import {MapType} from './utilTypes'

export interface ContentModelSchemaFieldBase {
  type: ContentModelSchemaTypes
  nameGUI?: string
  indexed?: boolean
  instructions?: string
  public?: boolean
  required?: boolean
  deprecationReason?: string
}

export interface ContentModelSchemaFieldLeaf extends ContentModelSchemaFieldBase {
  i18n?: boolean
}

export enum ContentModelSchemaTypes {
  id = 'id',
  string = 'string',
  boolean = 'boolean',
  int = 'int',
  float = 'float',
  enum = 'enum',
  dateTime = 'dateTime',
  richText = 'richText',
  reference = 'reference',
  list = 'list',
  object = 'object',
  union = 'union'
}
export interface ContentModelSchemaFieldId extends ContentModelSchemaFieldLeaf {
  type: ContentModelSchemaTypes.id
  defaultValue?: string
}

export interface ContentModelSchemaFieldString extends ContentModelSchemaFieldLeaf {
  type: ContentModelSchemaTypes.string
  defaultValue?: string
  validations?: {
    maxCharacters: number
  }
}

export interface ContentModelSchemaFieldBoolean extends ContentModelSchemaFieldLeaf {
  type: ContentModelSchemaTypes.boolean
  defaultValue?: boolean
}

export interface ContentModelSchemaFieldInt extends ContentModelSchemaFieldLeaf {
  type: ContentModelSchemaTypes.int
  defaultValue?: number
}
export interface ContentModelSchemaFieldFloat extends ContentModelSchemaFieldLeaf {
  type: ContentModelSchemaTypes.float
  defaultValue?: number
}

export type ContentModelSchemaFieldEnumValueConfigMap = {
  [key: string]: ContentModelSchemaFieldEnumValueConfig
}

export interface ContentModelSchemaFieldEnumValueConfig {
  description?: string
  value?: string
}

export interface ContentModelSchemaFieldEnum extends ContentModelSchemaFieldLeaf {
  type: ContentModelSchemaTypes.enum
  values: ContentModelSchemaFieldEnumValueConfig[]
  defaultValue?: number
}

export interface ContentModelSchemaFieldDate extends ContentModelSchemaFieldLeaf {
  type: ContentModelSchemaTypes.dateTime
  defaultValue?: Date
}

export interface ContentModelSchemaFieldRichText extends ContentModelSchemaFieldLeaf {
  type: ContentModelSchemaTypes.richText
}

export enum ReferenceScope {
  local = 'local',
  peers = 'peers',
  all = 'all'
}

export interface ContentModelSchemaFieldRefType {
  scope: ReferenceScope
  identifier: string
}

export interface ContentModelSchemaFieldRef extends ContentModelSchemaFieldLeaf {
  type: ContentModelSchemaTypes.reference
  types: ContentModelSchemaFieldRefType[]
}

export interface ContentModelSchemaFieldList extends ContentModelSchemaFieldBase {
  type: ContentModelSchemaTypes.list
  contentType: ContentModelSchemas
}

export interface ContentModelSchemaFieldObject extends ContentModelSchemaFieldBase {
  type: ContentModelSchemaTypes.object
  fields: MapType<ContentModelSchemas>
}

export interface ContentModelSchemaFieldUnion extends ContentModelSchemaFieldBase {
  type: ContentModelSchemaTypes.union
  cases: MapType<ContentModelSchemaFieldObject>
}

export type ContentModelSchemas =
  | ContentModelSchemaFieldId
  | ContentModelSchemaFieldString
  | ContentModelSchemaFieldInt
  | ContentModelSchemaFieldFloat
  | ContentModelSchemaFieldBoolean
  | ContentModelSchemaFieldDate
  | ContentModelSchemaFieldRichText
  | ContentModelSchemaFieldRef
  | ContentModelSchemaFieldEnum
  | ContentModelSchemaFieldList
  | ContentModelSchemaFieldObject
  | ContentModelSchemaFieldUnion

export interface ContentModelSchema {
  content: MapType<ContentModelSchemas>
  meta?: MapType<ContentModelSchemas>
}
