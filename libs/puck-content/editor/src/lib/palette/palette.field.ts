import { Palette } from '@mui/material';
import { BaseField } from '@puckeditor/core';
import { FieldAiParams } from '@puckeditor/plugin-ai';
import { z } from 'zod/v4';

import { toAiSchema } from '../ai-schema';

export type PaletteValue = Extract<
  keyof Palette,
  'primary' | 'secondary' | 'accent' | 'success' | 'info' | 'warning' | 'error'
>;

export const palettes = [
  'primary',
  'secondary',
  'accent',

  'success',
  'error',
  'info',
  'warning',
] as PaletteValue[];

export type PaletteField = BaseField & {
  type: 'palette';
  palettes?: PaletteValue[];
};

export const paletteSchema = (values: PaletteValue[] = palettes) =>
  z.enum(values);

export const paletteFieldAi = (
  values: PaletteValue[] = palettes
): FieldAiParams => ({
  instructions: `Colour palette of the website theme used to colour the element. One of: ${values.join(', ')}. Prefer primary for main call-to-actions and secondary or accent for less prominent elements; use success, error, info and warning only for status-related content.`,
  schema: toAiSchema(paletteSchema(values)),
});
