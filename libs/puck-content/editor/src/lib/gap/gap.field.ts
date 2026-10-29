import { BaseField } from '@puckeditor/core';
import { FieldAiParams } from '@puckeditor/plugin-ai';
import { z } from 'zod/v4';

import { toAiSchema } from '../ai-schema';
import { spacingSchema, SpacingValue } from '../spacing/spacing';

export type GapAxis = 'row' | 'column';
export const gapAxes: GapAxis[] = ['row', 'column'];

export type GapValue = Partial<Record<GapAxis, SpacingValue>>;

export type GapField = BaseField & {
  type: 'gap';
  axes?: GapAxis[];
};

export const gapSchema = (axes: GapAxis[] = gapAxes) =>
  z
    .object(
      Object.fromEntries(
        axes.map(axis => [
          axis,
          spacingSchema.describe(
            `${axis === 'row' ? 'Vertical gap between rows' : 'Horizontal gap between columns'}. ${spacingSchema.description}`
          ),
        ])
      )
    )
    .partial();

export const gapFieldAi = (axes: GapAxis[] = gapAxes): FieldAiParams => ({
  instructions: `Gap between the children, in theme spacing units or as pixel strings like "12px"${axes.length > 1 ? ', separately for rows and columns. Use the same number for both for an even spacing' : ''}.`,
  schema: toAiSchema(gapSchema(axes)),
});

export const isGapLinked = (value: GapValue | undefined) =>
  value?.row === value?.column;

export const setGap = (
  value: GapValue,
  axis: GapAxis,
  amount: SpacingValue | undefined
): GapValue => {
  const { [axis]: _previous, ...rest } = value;

  return amount === undefined ? rest : { ...rest, [axis]: amount };
};

export const setLinkedGap = (amount: SpacingValue | undefined): GapValue =>
  amount === undefined ? {} : { row: amount, column: amount };
