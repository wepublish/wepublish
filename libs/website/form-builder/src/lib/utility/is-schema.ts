import * as v from 'valibot'
import {InputSchemaMapping} from './input-schema-mapping'

export const isArraySchema = (input: InputSchemaMapping[0]): input is v.ArraySchema<any, any> => {
  return input.type === 'array'
}

export const isEnumSchema = (input: InputSchemaMapping[0]): input is v.EnumSchema<any, any> => {
  return input.type === 'enum'
}
