import { BaseField } from '@puckeditor/core';
import { FieldAiParams } from '@puckeditor/plugin-ai';
import { z } from 'zod/v4';

import { toAiSchema } from '../ai-schema';
import { colorSchema, ColorValue } from '../color/color.field';
import { sidesSchema, SidesValue } from '../sides/sides';

export type BorderStyle = 'solid' | 'dashed' | 'dotted';
export const borderStyles: BorderStyle[] = ['solid', 'dashed', 'dotted'];

export type BorderValue = {
  width?: SidesValue;
  style?: BorderStyle;
  color?: ColorValue;
};

export type BorderField = BaseField & {
  type: 'border';
};

export const borderSchema = z
  .object({
    width: sidesSchema('border width', 'px'),
    style: z.enum(borderStyles).describe('Line style of the border'),
    color: colorSchema().describe('Border colour, defaults to the text colour'),
  })
  .partial();

export const borderFieldAi: FieldAiParams = {
  instructions:
    'Border of the element: a width in pixels per side (same number on all sides for a uniform border, omitted sides have none), one line style (solid, dashed or dotted) and an optional colour that defaults to the text colour.',
  schema: toAiSchema(borderSchema),
};
