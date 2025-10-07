import * as v from 'valibot';
import { InputSchemaMapping } from './input-schema-mapping';

export const isArraySchema = (
  input: InputSchemaMapping[0]
): input is v.ArraySchema<any, any> => {
  return input.type === 'array';
};

export const isObjectSchema = (
  input: InputSchemaMapping[0]
): input is v.ObjectSchema<any, any> => {
  return input.type === 'object';
};

export const isEnumSchema = (
  input: InputSchemaMapping[0]
): input is v.EnumSchema<any, any> => {
  return input.type === 'enum';
};

export const isBooleanSchema = (
  input: InputSchemaMapping[0]
): input is v.BooleanSchema<any> => {
  return input.type === 'boolean';
};

export const isStringSchema = (
  input: InputSchemaMapping[0]
): input is v.StringSchema<any> => {
  return input.type === 'string';
};
