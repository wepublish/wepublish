import { BaseField } from '@puckeditor/core';
import { FieldAiParams } from '@puckeditor/plugin-ai';
import { z } from 'zod/v4';

import { toAiSchema } from '../ai-schema';

export type PaddingSide = 'top' | 'right' | 'bottom' | 'left';

export const paddingSides = ['top', 'right', 'bottom', 'left'] as PaddingSide[];

export type PaddingValue = {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
};

export type PaddingField = BaseField & {
  type: 'padding';
};

export const paddingSchema = z
  .object({
    top: z.number().describe('Top padding in pixels'),
    right: z.number().describe('Right padding in pixels'),
    bottom: z.number().describe('Bottom padding in pixels'),
    left: z.number().describe('Left padding in pixels'),
  })
  .partial();

export const paddingFieldAi: FieldAiParams = {
  instructions:
    'Inner padding of the element in pixels, per side. Set all four sides to the same number for uniform padding. Sides that are omitted keep the component default.',
  schema: toAiSchema(paddingSchema),
};
