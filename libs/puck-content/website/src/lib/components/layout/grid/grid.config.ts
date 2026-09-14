import { ComponentConfig } from '@puckeditor/core';

import {
  breakpointsFieldAi,
  columnsPresets,
  columnsSchema,
} from '@wepublish/puck-content/editor';
import { UserFields } from '../../../types';
import { defaultGap, gapFields, gapSchema } from '../gap';
import { GridProps, GridRender } from './grid.component';
import { itemsAlignmentFields, itemsAlignmentSchema } from '../items-alignment';

export const Grid: ComponentConfig<{
  props: GridProps;
  fields: UserFields;
}> = {
  ai: {
    instructions:
      'A column-based layout that places its nested components side by side in equal or proportionally sized columns. Choose a column preset per breakpoint via the layout field (mobile first: the smallest breakpoint is the base, larger breakpoints override it) and add components to the content slot. The layout field also sets the column and row gap in pixels and alignItems (start, center, end or stretch), the vertical alignment of the cells within a row, and justifyContent (start, center, end, space-between, space-around or space-evenly), the horizontal distribution of the columns. Use it to arrange content in a fixed set of columns.',
  },
  fields: {
    layout: {
      type: 'breakpoints',
      label: 'Layout',
      objectFields: {
        columns: {
          type: 'columns',
        },
        ...gapFields,
        ...itemsAlignmentFields,
      },
      ai: breakpointsFieldAi({
        columns: columnsSchema,
        ...gapSchema,
        ...itemsAlignmentSchema,
      }),
    },
    content: {
      type: 'slot',
    },
  },
  defaultProps: {
    layout: {
      xs: {
        columns: columnsPresets[0],
        columnGap: defaultGap,
        rowGap: defaultGap,
        alignItems: 'stretch',
        justifyContent: 'start',
      },
      md: { columns: columnsPresets[1] },
    },
    content: [],
  },
  render: GridRender,
};
