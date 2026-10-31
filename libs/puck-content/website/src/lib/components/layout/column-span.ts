import { Theme } from '@emotion/react';

import {
  breakpointsFieldAi,
  BreakpointsField,
  breakpointsStyles,
  BreakpointsValue,
} from '@wepublish/puck-content/editor';
import { z } from 'zod/v4';

export type ColumnSpan = {
  columnSpan?: number;
  rowSpan?: number;
};

export type ColumnSpanValue = BreakpointsValue<ColumnSpan>;

export const defaultColumnSpan: ColumnSpanValue = {
  xs: { columnSpan: 12, rowSpan: 1 },
  md: { columnSpan: 6, rowSpan: 1 },
};

export const columnSpanField: BreakpointsField = {
  type: 'breakpoints',
  objectFields: {
    columnSpan: {
      type: 'number',
      label: 'Column span',
      min: 1,
      max: 12,
    },
    rowSpan: {
      type: 'number',
      label: 'Row span',
      min: 1,
      max: 12,
    },
  },
  ai: breakpointsFieldAi({
    columnSpan: z
      .number()
      .min(1)
      .max(12)
      .describe('Number of columns the element spans'),
    rowSpan: z
      .number()
      .min(1)
      .max(12)
      .describe('Number of rows the element spans'),
  }),
};

const toSpanStyles = (span: ColumnSpan | undefined) => ({
  gridColumn: span?.columnSpan ? `span ${span.columnSpan}` : undefined,
  gridRow: span?.rowSpan ? `span ${span.rowSpan}` : undefined,
});

/**
 * Emotion styles applying the column/row span per breakpoint (mobile first).
 */
export const columnSpanStyles =
  (span: ColumnSpanValue | undefined) => (theme: Theme) =>
    breakpointsStyles(theme, span, toSpanStyles);
