import { z } from 'zod/v4';

import {
  BreakpointsField,
  breakpointsFieldAi,
} from '../../breakpoints/breakpoints.field';

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
