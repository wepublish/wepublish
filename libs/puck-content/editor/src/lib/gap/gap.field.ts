import { BaseField } from '@puckeditor/core';
import { FieldAiParams } from '@puckeditor/plugin-ai';
import { z } from 'zod/v4';

import { toAiSchema } from '../ai-schema';

export type GapAxis = 'row' | 'column';
export const gapAxes: GapAxis[] = ['row', 'column'];

export type GapValue = Partial<Record<GapAxis, number>>;

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
          z
            .number()
            .min(0)
            .describe(
              axis === 'row' ?
                'Vertical gap between rows in pixels'
              : 'Horizontal gap between columns in pixels'
            ),
        ])
      )
    )
    .partial();

export const gapFieldAi = (axes: GapAxis[] = gapAxes): FieldAiParams => ({
  instructions: `Gap between the children in pixels${axes.length > 1 ? ', separately for rows and columns. Use the same number for both for an even spacing' : ''}.`,
  schema: toAiSchema(gapSchema(axes)),
});

export const isGapLinked = (value: GapValue | undefined) =>
  value?.row === value?.column;

export const setGap = (
  value: GapValue,
  axis: GapAxis,
  amount: number | undefined
): GapValue => {
  const { [axis]: _previous, ...rest } = value;

  return amount === undefined ? rest : { ...rest, [axis]: amount };
};

export const setLinkedGap = (amount: number | undefined): GapValue =>
  amount === undefined ? {} : { row: amount, column: amount };
