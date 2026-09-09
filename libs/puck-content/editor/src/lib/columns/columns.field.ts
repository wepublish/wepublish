import { BaseField } from '@puckeditor/core';
import { FieldAiParams } from '@puckeditor/plugin-ai';
import { z } from 'zod/v4';

import { toAiSchema } from '../ai-schema';

export type ColumnsValue = number[];

export type ColumnsField = BaseField & {
  type: 'columns';
};

export const columnsPresets = [
  [1],
  [1, 1],
  [1, 1, 1],
  [1, 1, 1, 1],
  [1, 2],
  [2, 1],
  [1, 2, 1, 2],
  [2, 1, 2, 1],
] satisfies ColumnsValue[];

export const columnsSchema = z.array(z.number().min(1)).min(1);

export const columnsFieldAi: FieldAiParams = {
  instructions: `Column layout as an array of fractional width units (CSS grid fr), one entry per column. [1, 1] is two equal columns, [1, 2] makes the second column twice as wide as the first. Prefer one of the presets: ${JSON.stringify(columnsPresets)}.`,
  schema: toAiSchema(columnsSchema),
};
