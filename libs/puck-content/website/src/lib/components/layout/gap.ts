import { CSSObject } from '@emotion/react';

import {
  GapAxis,
  GapField,
  gapFieldAi,
  gapSchema as gapValueSchema,
  GapValue,
} from '@wepublish/puck-content/editor';

export type GapLayout = {
  gap?: GapValue;
};

export const defaultGap: GapValue = { row: 16, column: 16 };

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

export const gapStyles = (layout: GapLayout | undefined): CSSObject => ({
  rowGap: layout?.gap?.row,
  columnGap: layout?.gap?.column,
});
