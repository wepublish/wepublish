import { Theme } from '@emotion/react';

import { breakpointsStyles, BreakpointsValue } from '../../values/breakpoints';

export type ColumnSpan = {
  columnSpan?: number;
  rowSpan?: number;
};

export type ColumnSpanValue = BreakpointsValue<ColumnSpan>;

export const defaultColumnSpan: ColumnSpanValue = {
  xs: { columnSpan: 12, rowSpan: 1 },
  md: { columnSpan: 6, rowSpan: 1 },
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
