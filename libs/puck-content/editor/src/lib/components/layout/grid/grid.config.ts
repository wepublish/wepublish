import { ComponentConfig } from '@puckeditor/core';
import {
  columnsPresets,
  GridProps,
  GridRender,
} from '@wepublish/puck-content/website';
import { MdViewColumn } from 'react-icons/md';

import { editorRender } from '../../../blocks/editor-render';
import { breakpointsFieldAi } from '../../../breakpoints/breakpoints.field';
import { columnsSchema } from '../../../columns/columns.field';
import { UserFields } from '../../../fields';
import { defaultGap, gapFields, gapLayoutSchema } from '../gap.field';
import {
  itemsAlignmentFields,
  itemsAlignmentSchema,
} from '../items-alignment.field';

export const Grid: ComponentConfig<{
  props: GridProps;
  fields: UserFields;
}> = {
  icon: MdViewColumn,
  category: 'layout',
  order: 2,
  nameKey: 'puck.blocks.names.Grid',
  ai: {
    instructions:
      'A column-based layout that places its nested components side by side in equal or proportionally sized columns. Choose a column preset per breakpoint via the layout field (mobile first: the smallest breakpoint is the base, larger breakpoints override it) and add components to the content slot. The layout field also sets the column and row gap in theme spacing units (or exact pixel strings like "12px") and alignItems (start, center, end or stretch), the vertical alignment of the cells within a row, and justifyContent (start, center, end, space-between, space-around or space-evenly), the horizontal distribution of the columns. Use it to arrange content in a fixed set of columns.',
  },
  fields: {
    layout: {
      type: 'breakpoints',
      label: 'Layout',
      hideLabel: true,
      objectFields: {
        columns: {
          type: 'columns',
        },
        ...gapFields(),
        ...itemsAlignmentFields,
      },
      ai: breakpointsFieldAi({
        columns: columnsSchema,
        ...gapLayoutSchema(),
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
        gap: defaultGap,
        alignItems: 'stretch',
        justifyContent: 'start',
      },
      md: { columns: columnsPresets[1] },
    },
    content: [],
  },
  render: editorRender(GridRender, { minEmptyHeight: 300 }),
};
