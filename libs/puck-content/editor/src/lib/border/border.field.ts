import { BaseField } from '@puckeditor/core';
import { FieldAiParams } from '@puckeditor/plugin-ai';
import { z } from 'zod/v4';

import { toAiSchema } from '../ai-schema';
import { colorSchema, ColorValue } from '../color/color.field';
import { Side, sides, sidesSchema, SidesValue } from '../sides/sides';
import { toSpacingParts } from '../spacing/spacing';

export type BorderStyle = 'solid' | 'dashed' | 'dotted';
export const borderStyles: BorderStyle[] = ['solid', 'dashed', 'dotted'];

export type BorderWidthValue = Partial<Record<Side, number>>;

export type BorderValue = {
  width?: BorderWidthValue;
  style?: BorderStyle;
  color?: ColorValue;
};

export const toBorderWidth = (value: SidesValue): BorderWidthValue =>
  Object.fromEntries(
    sides.flatMap(side => {
      const { amount } = toSpacingParts(value[side]);

      return amount === undefined || Number.isNaN(amount) ?
          []
        : [[side, amount]];
    })
  );

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
