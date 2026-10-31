import { GapAxis, GapValue } from '@wepublish/puck-content/website';

import {
  GapField,
  gapFieldAi,
  gapSchema as gapValueSchema,
} from '../../gap/gap.field';

export const defaultGap: GapValue = { row: 2, column: 2 };

export const gapFields = (axes?: GapAxis[]): { gap: GapField } => ({
  gap: {
    type: 'gap',
    label: 'Gap',
    axes,
    ai: gapFieldAi(axes),
  },
});

export const gapLayoutSchema = (axes?: GapAxis[]) => ({
  gap: gapValueSchema(axes).describe(
    'Gap between the children, as a number of theme spacing units (usually 8px each) or an exact pixel string like "12px"'
  ),
});
