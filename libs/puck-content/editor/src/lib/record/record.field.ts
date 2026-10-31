import { BaseField } from '@puckeditor/core';
import { FieldAiParams } from '@puckeditor/plugin-ai';
import { z } from 'zod/v4';

import { toAiSchema } from '../ai-schema';

export const recordModels = [
  'article',
  'page',
  'event',
  'memberPlan',
  'author',
  'paywall',
] as const;

export type RecordModel = (typeof recordModels)[number];

export type RecordId = string;

export type RecordField = BaseField & {
  type: 'record';
  model: RecordModel;
  multiple?: boolean;
  min?: number;
  max?: number;
  placeholder?: string;
};

export type RecordValue = RecordId | RecordId[];

export type RecordBounds = {
  min?: number;
  max?: number;
};

export type RecordStatus = 'published' | 'pending' | 'draft' | 'none';

export type RecordOption = {
  id: RecordId;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  status?: RecordStatus;
};

const recordModelNames = {
  article: 'article',
  page: 'page',
  event: 'event',
  memberPlan: 'member plan',
  author: 'author',
  paywall: 'paywall',
} satisfies Record<RecordModel, string>;

export const recordSchema = (multiple: boolean, bounds: RecordBounds = {}) => {
  if (!multiple) {
    return z.string();
  }

  let schema = z.array(z.string());

  if (bounds.min !== undefined) {
    schema = schema.min(bounds.min);
  }

  if (bounds.max !== undefined) {
    schema = schema.max(bounds.max);
  }

  return schema;
};

export const recordFieldAi = (
  model: RecordModel,
  multiple: boolean,
  bounds: RecordBounds = {}
): FieldAiParams => {
  const name = recordModelNames[model];

  return {
    instructions:
      multiple ?
        `IDs of existing ${name} records in display order. Keep the existing values and never invent an ID.`
      : `The ID of an existing ${name} record. Keep the existing value and never invent an ID.`,
    schema: toAiSchema(recordSchema(multiple, bounds)),
  };
};

export const recordField = ({
  model,
  multiple = false,
  ...rest
}: Omit<RecordField, 'type' | 'ai'>): RecordField => ({
  ...rest,
  type: 'record',
  model,
  multiple,
  ai: recordFieldAi(model, multiple, rest),
});

export const toRecordIds = (
  value: RecordValue | null | undefined
): RecordId[] => {
  const ids: Array<RecordId | null | undefined> =
    Array.isArray(value) ? value : [value];

  return ids.filter(
    (id, index): id is RecordId =>
      typeof id === 'string' && id !== '' && ids.indexOf(id) === index
  );
};

export const clampRecordIds = (ids: RecordId[], { max }: RecordBounds) => {
  const unique = toRecordIds(ids);

  return max === undefined ? unique : unique.slice(0, max);
};

export const canAddRecord = (ids: RecordId[], { max }: RecordBounds) =>
  max === undefined || ids.length < max;

export const canRemoveRecord = (ids: RecordId[], { min }: RecordBounds) =>
  min === undefined || ids.length > min;

export const removeRecordId = (ids: RecordId[], id: RecordId) =>
  ids.filter(existing => existing !== id);

export const toggleRecordId = (
  ids: RecordId[],
  id: RecordId,
  bounds: RecordBounds = {}
) => {
  if (ids.includes(id)) {
    return removeRecordId(ids, id);
  }

  return canAddRecord(ids, bounds) ? [...ids, id] : ids;
};

export const moveRecordId = (ids: RecordId[], from: number, to: number) => {
  if (from < 0 || to < 0 || from >= ids.length || to >= ids.length) {
    return ids;
  }

  const next = [...ids];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);

  return next;
};

export const recordStatusOf = ({
  draft,
  pending,
  published,
}: {
  draft?: unknown;
  pending?: unknown;
  published?: unknown;
}): RecordStatus => {
  if (pending) {
    return 'pending';
  }

  if (published) {
    return 'published';
  }

  if (draft) {
    return 'draft';
  }

  return 'none';
};

export const matchesRecordQuery = (
  text: string | null | undefined,
  query: string
) => {
  const needle = query.trim().toLowerCase();

  if (!needle) {
    return true;
  }

  return !!text && text.toLowerCase().includes(needle);
};
