import { BaseField } from '@puckeditor/core';
import { FieldAiParams } from '@puckeditor/plugin-ai';

import { toAiSchema } from '../ai-schema';
import { sidesSchema, SidesValue } from '../sides/sides';

export type PaddingValue = SidesValue;

export type PaddingField = BaseField & {
  type: 'padding';
};

export const paddingSchema = sidesSchema('padding');

export const paddingFieldAi: FieldAiParams = {
  instructions:
    'Inner padding of the element in pixels, per side. Use the same number on all four sides for uniform padding, or the same top/bottom and left/right values for vertical and horizontal padding. Omitted sides keep the component default.',
  schema: toAiSchema(paddingSchema),
};
