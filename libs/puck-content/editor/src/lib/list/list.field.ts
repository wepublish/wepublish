import { BaseField, Field } from '@puckeditor/core';
import { FieldAiParams } from '@puckeditor/plugin-ai';
import { z } from 'zod/v4';

import { toAiSchema } from '../ai-schema';

import { UserFields } from '../fields';

export type ListValue<Item = unknown> = Item[];

/**
 * Like Puck's `array` field but every entry is a single value (string,
 * number, color, ...) instead of an object of sub fields.
 *
 * @example
 * tags: {
 *   type: 'list',
 *   itemField: { type: 'text', placeholder: 'Tag' },
 *   defaultItem: '',
 * }
 */
export type ListField<Item = unknown> = BaseField & {
  type: 'list';
  itemField:
    | Field<Item, UserFields[keyof UserFields]>
    | UserFields[keyof UserFields];
  defaultItem?: Item | ((index: number) => Item);
  min?: number;
  max?: number;
};

export const listSchema = (
  item: z.ZodType,
  { min, max }: { min?: number; max?: number } = {}
) => {
  let schema = z.array(item);

  if (min !== undefined) {
    schema = schema.min(min);
  }

  if (max !== undefined) {
    schema = schema.max(max);
  }

  return schema;
};

export const listFieldAi = (
  item: z.ZodType,
  instructions?: string,
  bounds: { min?: number; max?: number } = {}
): FieldAiParams => ({
  instructions: instructions ?? 'A list of values, one entry per item.',
  schema: toAiSchema(listSchema(item, bounds)),
});
