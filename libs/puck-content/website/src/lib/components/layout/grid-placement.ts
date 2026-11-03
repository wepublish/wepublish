import { CSSObject, Theme } from '@emotion/react';

import { breakpointsStyles, BreakpointsValue } from '../../values/breakpoints';
import { GridLine, GridPlacementValue } from '../../values/grid-placement';

export const gridLineToCss = (line: GridLine | undefined) => {
  const span = line?.span ? `span ${line.span}` : undefined;
  const start = line?.start ? `${line.start}` : undefined;

  if (start && span) {
    return `${start} / ${span}`;
  }

  return start ?? span;
};

export const gridPlacementStyles = (
  theme: Theme,
  placement: BreakpointsValue<GridPlacementValue> | undefined
): CSSObject =>
  breakpointsStyles(theme, placement, resolved => ({
    gridColumn: gridLineToCss(resolved?.column),
    gridRow: gridLineToCss(resolved?.row),
  }));
