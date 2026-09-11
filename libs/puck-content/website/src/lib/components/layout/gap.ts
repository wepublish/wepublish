import { CSSObject } from '@emotion/react';
import { z } from 'zod/v4';

import { BreakpointsField } from '@wepublish/puck-content/editor';

export type GapValue = {
  columnGap?: number;
  rowGap?: number;
};

export const defaultGap = 16;

/**
 * Sub fields for a breakpoints field controlling the gaps between the
 * children of a grid-like layout.
 */
export const gapFields: BreakpointsField<GapValue>['objectFields'] = {
  columnGap: {
    type: 'number',
    label: 'Column gap',
    min: 0,
  },
  rowGap: {
    type: 'number',
    label: 'Row gap',
    min: 0,
  },
};

export const gapSchema = {
  columnGap: z
    .number()
    .min(0)
    .describe('Horizontal gap between columns in pixels'),
  rowGap: z.number().min(0).describe('Vertical gap between rows in pixels'),
};

export const gapStyles = (gap: GapValue | undefined): CSSObject => ({
  columnGap: gap?.columnGap,
  rowGap: gap?.rowGap,
});
