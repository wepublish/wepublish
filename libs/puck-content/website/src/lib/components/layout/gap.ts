import { CSSObject, Theme } from '@emotion/react';

import {
  GapAxis,
  GapField,
  gapFieldAi,
  gapSchema as gapValueSchema,
  GapValue,
  spacingToCss,
} from '@wepublish/puck-content/editor';

export type GapLayout = {
  gap?: GapValue;
};

export const defaultGap: GapValue = { row: 2, column: 2 };

/**
 * Sub field for a breakpoints field controlling the gaps between the
 * children of a grid-like layout.
 */
export const gapFields = (axes?: GapAxis[]): { gap: GapField } => ({
  gap: {
    type: 'gap',
    label: 'Gap',
    axes,
    ai: gapFieldAi(axes),
  },
});

export const gapSchema = (axes?: GapAxis[]) => ({
  gap: gapValueSchema(axes).describe('Gap between the children in pixels'),
});

export const gapStyles = (
  theme: Theme,
  layout: GapLayout | undefined
): CSSObject => ({
  rowGap: spacingToCss(theme, layout?.gap?.row),
  columnGap: spacingToCss(theme, layout?.gap?.column),
});
