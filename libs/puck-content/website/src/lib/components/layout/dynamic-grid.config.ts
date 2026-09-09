import { ComponentConfig } from '@puckeditor/core';

import {
  defaultBreakpoints,
  visibilityFieldAi,
} from '@wepublish/puck-content/editor';
import { UserFields } from '../../types';
import { columnSpanField, defaultColumnSpan } from './column-span';
import {
  DynamicGridItem,
  DynamicGridProps,
  DynamicGridRender,
} from './dynamic-grid.component';

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
      'A flexible 12-column grid layout. Each entry in items is a cell with its own column span and row span per breakpoint, an optional visibility list of the breakpoints the cell is shown on and a content slot for nested components. Use it for multi-column arrangements of mixed content.',
  },
  fields: {
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
    items: [defaultItem, defaultItem],
  },
  render: DynamicGridRender,
};
