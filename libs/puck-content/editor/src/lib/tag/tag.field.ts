import { BaseField } from '@puckeditor/core';
import { FieldAiParams } from '@puckeditor/plugin-ai';
import { z } from 'zod/v4';

import { toAiSchema } from '../ai-schema';
import { ListItemField, listSchema } from '../list/list.field';

export type TagValue<Item = unknown> = Item[];

/**
 * A set of values shown as tags. Unlike the `list` field the order does not
 * matter and every value can only be picked once: options already chosen are
 * removed from the picker and there is no drag & drop.
 *
 * @example
 * fields: {
 *   type: 'tag',
 *   itemField: {
 *     type: 'select',
 *     options: [{ label: 'Name', value: 'name' }],
 *   },
 * }
 */
export type TagField<Item = unknown> = BaseField & {
  type: 'tag';
  itemField: ListItemField<Item>;
  min?: number;
  max?: number;
};

export const tagSchema = (
  item: z.ZodType,
  bounds: { min?: number; max?: number } = {}
) => listSchema(item, bounds);

export const tagFieldAi = (
  item: z.ZodType,
  instructions?: string,
  bounds: { min?: number; max?: number } = {}
): FieldAiParams => ({
  instructions:
    instructions ??
    'A set of tags. Every value may only appear once, the order is irrelevant.',
  schema: toAiSchema(tagSchema(item, bounds)),
});
