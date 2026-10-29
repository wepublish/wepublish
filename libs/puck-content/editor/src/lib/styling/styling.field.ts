import { BaseField } from '@puckeditor/core';
import { FieldAiParams } from '@puckeditor/plugin-ai';
import { z } from 'zod/v4';

import { toAiSchema } from '../ai-schema';
import { alignmentSchema, AlignmentValue } from '../alignment/alignment.field';
import { borderSchema, BorderValue } from '../border/border.field';
import { colorSchema, ColorValue } from '../color/color.field';
import { paddingSchema, PaddingValue } from '../padding/padding.field';
import { Side, sides, sidesSchema, SidesValue } from '../sides/sides';

export type TextAlignValue = Extract<
  AlignmentValue,
  'left' | 'center' | 'right'
>;
export const textAlignValues: TextAlignValue[] = ['left', 'center', 'right'];

export type StylingValue = {
  color?: ColorValue;
  background?: ColorValue;
  textAlign?: TextAlignValue;
  margin?: SidesValue;
  padding?: PaddingValue;
  border?: BorderValue;
};

export type StylingField = BaseField & {
  type: 'styling';
  marginSides?: Side[];
};

export const stylingSchema = (marginSides: Side[] = sides) =>
  z
    .object({
      color: colorSchema().describe('Text colour of the component'),
      background: colorSchema().describe('Background colour of the component'),
      textAlign: alignmentSchema(textAlignValues).describe('Text alignment'),
      margin: sidesSchema('margin', 'spacing', marginSides).describe(
        'Outer spacing per side'
      ),
      padding: paddingSchema.describe('Inner spacing per side'),
      border: borderSchema.describe('Border of the component'),
    })
    .partial();

export const stylingFieldAi = (marginSides?: Side[]): FieldAiParams => ({
  instructions:
    'Styling of the component: text and background colour, text alignment, and the box model (margin outside the border, the border itself, padding inside it). Leave out anything that should keep the component default.',
  schema: toAiSchema(stylingSchema(marginSides)),
});
