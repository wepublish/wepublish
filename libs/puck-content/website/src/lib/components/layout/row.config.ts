import { ComponentConfig } from '@puckeditor/core';

import { breakpointsFieldAi } from '@wepublish/puck-content/editor';
import { UserFields } from '../../types';
import { defaultGap, gapFields, gapSchema } from './gap';
import { itemsAlignmentFields, itemsAlignmentSchema } from './items-alignment';
import { RowProps, RowRender } from './row.component';

export const Row: ComponentConfig<{
  props: RowProps;
  fields: UserFields;
}> = {
  ai: {
    instructions:
      'A single horizontal row that places all nested components side by side, each sized by its own content. Put components into the content slot. The layout field sets per breakpoint the column gap between the components in pixels and alignItems (start, center, end or stretch), the vertical alignment of the components within the row, and justifyContent (start, center, end, space-between, space-around or space-evenly), their horizontal distribution. Use it for inline arrangements such as a button next to a text or several small elements in one line. For column layouts with fixed widths use Grid or DynamicGrid instead.',
  },
  fields: {
    content: {
      type: 'slot',
    },
    layout: {
      type: 'breakpoints',
      label: 'Layout',
      objectFields: {
        columnGap: gapFields.columnGap,
        ...itemsAlignmentFields,
      },
      ai: breakpointsFieldAi({
        columnGap: gapSchema.columnGap,
        ...itemsAlignmentSchema,
      }),
    },
  },
  defaultProps: {
    content: [],
    layout: {
      xs: {
        columnGap: defaultGap,
        alignItems: 'center',
        justifyContent: 'start',
      },
    },
  },
  render: RowRender,
};
