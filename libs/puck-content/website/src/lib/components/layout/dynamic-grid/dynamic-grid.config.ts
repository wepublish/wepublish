import { ComponentConfig } from '@puckeditor/core';

import {
  breakpointsFieldAi,
  defaultBreakpoints,
  visibilityFieldAi,
} from '@wepublish/puck-content/editor';
import { UserFields } from '../../../types';
import { columnSpanField, defaultColumnSpan } from '../column-span';
import {
  DynamicGridItem,
  DynamicGridProps,
  DynamicGridRender,
} from './dynamic-grid.component';
import { defaultGap, gapFields, gapSchema } from '../gap';
import { itemsAlignmentFields, itemsAlignmentSchema } from '../items-alignment';

const defaultItem: DynamicGridItem = {
  span: defaultColumnSpan,
  visibility: defaultBreakpoints,
  content: [],
};

type DynamicGridConfig = ComponentConfig<{
  props: DynamicGridProps;
  fields: UserFields;
}>;

export const DynamicGrid: DynamicGridConfig = {
  ai: {
    instructions:
      'A flexible 12-column grid layout. Each entry in items is a cell with its own column span and row span per breakpoint, an optional visibility list of the breakpoints the cell is shown on and a content slot for nested components. The layout field sets per breakpoint the column and row gap in pixels and alignItems (start, center, end or stretch), the vertical alignment of the cells within a row, and justifyContent (start, center, end, space-between, space-around or space-evenly), the horizontal distribution of the columns. Use it for multi-column arrangements of mixed content.',
  },
  fields: {
    layout: {
      type: 'breakpoints',
      label: 'Layout',
      objectFields: {
        ...gapFields,
        ...itemsAlignmentFields,
      },
      ai: breakpointsFieldAi({
        ...gapSchema,
        ...itemsAlignmentSchema,
      }),
    },
    items: {
      type: 'array',
      label: 'Items',
      getItemSummary: (_item: DynamicGridItem, index = 0) =>
        `Item ${index + 1}`,
      defaultItemProps: defaultItem,
      arrayFields: {
        span: columnSpanField,
        visibility: {
          type: 'visibility',
          label: 'Visibility',
          ai: visibilityFieldAi(),
        },
        content: {
          type: 'slot',
        },
      },
    },
  } as unknown as DynamicGridConfig['fields'],
  defaultProps: {
    layout: {
      xs: {
        columnGap: defaultGap,
        rowGap: defaultGap,
        alignItems: 'stretch',
        justifyContent: 'start',
      },
    },
    items: [defaultItem, defaultItem],
  },
  render: DynamicGridRender,
};
