import { BaseField } from '@puckeditor/core';
import { FieldAiParams } from '@puckeditor/plugin-ai';
import { z } from 'zod/v4';
import { GridLine, GridPlacementAxis } from '@wepublish/puck-content/website';

import { toAiSchema } from '../ai-schema';

export { gridPlacementAxes } from '@wepublish/puck-content/website';
export type {
  GridLine,
  GridPlacementAxis,
  GridPlacementValue,
} from '@wepublish/puck-content/website';

export const defaultGridColumns = 12;
export const maxGridRowSpan = 12;

export type GridPlacementField = BaseField & {
  type: 'gridPlacement';
  axis: GridPlacementAxis;
  columns?: number;
};

export const maxGridLineStart = (
  axis: GridPlacementAxis,
  columns = defaultGridColumns
) => (axis === 'column' ? columns : undefined);

export const maxGridLineSpan = (
  axis: GridPlacementAxis,
  line: GridLine,
  columns = defaultGridColumns
) => (axis === 'column' ? columns - (line.start ?? 1) + 1 : maxGridRowSpan);

const clamp = (value: number, max = Infinity) =>
  Math.min(Math.max(Math.round(value), 1), max);

export const setGridLine = (
  axis: GridPlacementAxis,
  line: GridLine,
  key: keyof GridLine,
  amount: number | undefined,
  columns = defaultGridColumns
): GridLine => {
  const next = { ...line, [key]: amount };
  const start =
    next.start === undefined ?
      undefined
    : clamp(next.start, maxGridLineStart(axis, columns));
  const span =
    next.span === undefined ?
      undefined
    : clamp(next.span, maxGridLineSpan(axis, { start }, columns));

  return {
    ...(start !== undefined && { start }),
    ...(span !== undefined && { span }),
  };
};

export const gridLineRange = (line: GridLine | undefined) =>
  line?.start === undefined ?
    undefined
  : { from: line.start, to: line.start + (line.span ?? 1) - 1 };

export const gridLineSchema = (
  axis: GridPlacementAxis,
  columns = defaultGridColumns
) => {
  const start = z.number().int().min(1);
  const span = z.number().int().min(1);

  return z
    .object({
      start: (axis === 'column' ? start.max(columns) : start).describe(
        axis === 'column' ?
          `Grid column the cell starts in, 1 being the leftmost of ${columns}. Leave it out to place the cell automatically after the previous one`
        : 'Grid row the cell starts in, 1 being the top row. Leave it out to place the cell automatically'
      ),
      span: span
        .max(axis === 'column' ? columns : maxGridRowSpan)
        .describe(
          axis === 'column' ?
            `Number of columns the cell covers. start + span - 1 must not exceed ${columns}`
          : 'Number of rows the cell covers'
        ),
    })
    .partial();
};

export const gridPlacementFieldAi = (
  axis: GridPlacementAxis,
  columns = defaultGridColumns
): FieldAiParams => ({
  instructions:
    axis === 'column' ?
      `Horizontal placement of the cell on the ${columns}-column grid: start is the column it begins in (leave it out to flow after the previous cell, set it to offset the cell), span the number of columns it covers. start + span - 1 must not exceed ${columns}.`
    : `Vertical placement of the cell: start is the row it begins in (leave it out to flow automatically), span the number of rows it covers, at most ${maxGridRowSpan}.`,
  schema: toAiSchema(gridLineSchema(axis, columns)),
});
