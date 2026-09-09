import { ComponentConfig } from '@puckeditor/core';

import {
  breakpointsFieldAi,
  columnsPresets,
  columnsSchema,
} from '@wepublish/puck-content/editor';
import { UserFields } from '../../types';
import { GridProps, GridRender } from './grid.component';

export const Grid: ComponentConfig<{
  props: GridProps;
  fields: UserFields;
}> = {
  ai: {
    instructions:
      'A column-based layout that places its nested components side by side in equal or proportionally sized columns. Choose a column preset per breakpoint via the layout field (mobile first: the smallest breakpoint is the base, larger breakpoints override it) and add components to the content slot. Use it to arrange content in a fixed set of columns.',
  },
  fields: {
    layout: {
      type: 'breakpoints',
      label: 'Layout',
      objectFields: {
        columns: {
          type: 'columns',
        },
      },
      ai: breakpointsFieldAi({ columns: columnsSchema }),
    },
    content: {
      type: 'slot',
    },
  },
  defaultProps: {
    layout: {
      xs: { columns: columnsPresets[0] },
      md: { columns: columnsPresets[1] },
    },
    content: [],
  },
  render: GridRender,
};
