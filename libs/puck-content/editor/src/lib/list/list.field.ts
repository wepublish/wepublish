import { BaseField, Field, SelectField } from '@puckeditor/core';
import { FieldAiParams } from '@puckeditor/plugin-ai';
import { z } from 'zod/v4';

import { toAiSchema } from '../ai-schema';

import { UserFields } from '../fields';

export type ListValue<Item = unknown> = Item[];

export type ListItemField<Item = unknown> =
  | Field<Item, UserFields[keyof UserFields]>
  | UserFields[keyof UserFields];

/**
 * Like Puck's `array` field but every entry is a single value (string,
 * number, color, ...) instead of an object of sub fields.
 *
 * With `unique` every value can only be picked once: options already chosen
 * in one row are removed from the selects of the other rows.
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
  itemField: ListItemField<Item>;
  defaultItem?: Item | ((index: number) => Item);
  min?: number;
  max?: number;
  unique?: boolean;
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

export const isSameListItem = (a: unknown, b: unknown) => {
  if (a === b) {
    return true;
  }

  if (typeof a === 'object' && typeof b === 'object' && a && b) {
    return JSON.stringify(a) === JSON.stringify(b);
  }

  return false;
};

export const getListItemOptions = <Item>(
  itemField: ListItemField<Item>
): SelectField['options'] | undefined => {
  if (
    (itemField.type === 'select' || itemField.type === 'radio') &&
    Array.isArray(itemField.options)
  ) {
    return itemField.options;
  }

  return undefined;
};

/**
 * Drops every option whose value is already used in `taken`, so a value can
 * only be picked once across all rows of a list.
 */
export const withoutTakenOptions = <Item>(
  itemField: ListItemField<Item>,
  taken: readonly unknown[]
): ListItemField<Item> => {
  const options = getListItemOptions(itemField);

  if (!options) {
    return itemField;
  }

  return {
    ...itemField,
    options: options.filter(
      option => !taken.some(value => isSameListItem(value, option.value))
    ),
  } as ListItemField<Item>;
};
