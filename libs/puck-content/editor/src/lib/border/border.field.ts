import { BaseField } from '@puckeditor/core';
import { FieldAiParams } from '@puckeditor/plugin-ai';
import { z } from 'zod/v4';

import { toAiSchema } from '../ai-schema';

export type BorderSide = 'top' | 'right' | 'bottom' | 'left';
export const borderSides = ['top', 'right', 'bottom', 'left'] as BorderSide[];

export type BorderStyle = 'solid' | 'dashed' | 'dotted';
export const borderStyles = ['solid', 'dashed', 'dotted'] as BorderStyle[];

export type BorderSideValue = {
  width?: number;
  style?: BorderStyle;
};

export type BorderValue = {
  top?: BorderSideValue;
  right?: BorderSideValue;
  bottom?: BorderSideValue;
  left?: BorderSideValue;
};

export type BorderField = BaseField & {
  type: 'border';
};

export const borderSideSchema = z
  .object({
    width: z.number().describe('Border width in pixels'),
    style: z.enum(borderStyles),
  })
  .partial();

export const borderSchema = z
  .object({
    top: borderSideSchema,
    right: borderSideSchema,
    bottom: borderSideSchema,
    left: borderSideSchema,
  })
  .partial();

export const borderFieldAi: FieldAiParams = {
  instructions:
    'Border of the element, per side. Each side takes a width in pixels and a style (solid, dashed or dotted). Use the same value on all four sides for a uniform border; omitted sides have no border.',
  schema: toAiSchema(borderSchema),
};
