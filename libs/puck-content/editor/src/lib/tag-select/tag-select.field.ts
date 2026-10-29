import { BaseField } from '@puckeditor/core';
import { FieldAiParams } from '@puckeditor/plugin-ai';
import { TagType } from '@wepublish/editor/api';
import { z } from 'zod/v4';

import { toAiSchema } from '../ai-schema';

export type TagSelectValue = string[];

export type TagSelectField = BaseField & {
  type: 'tagSelect';
  tagType: TagType;
};

export const tagSelectSchema = z.array(z.string());

export const tagSelectFieldAi: FieldAiParams = {
  instructions:
    'IDs of existing tags. Keep the existing value and never invent an ID.',
  schema: toAiSchema(tagSelectSchema),
};

export const pageTagSelectField = (label?: string): TagSelectField => ({
  type: 'tagSelect',
  tagType: TagType.Page,
  label,
  ai: tagSelectFieldAi,
});
