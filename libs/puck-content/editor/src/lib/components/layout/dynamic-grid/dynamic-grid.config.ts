import { ComponentConfig } from '@puckeditor/core';
import {
  defaultBreakpoints,
  defaultColumnSpan,
  DynamicGridItem,
  DynamicGridProps,
  DynamicGridRender,
} from '@wepublish/puck-content/website';

import { editorRender } from '../../../blocks/editor-render';
import { breakpointsFieldAi } from '../../../breakpoints/breakpoints.field';
import { visibilityFieldAi } from '../../../visibility/visibility.field';
import { UserFields } from '../../../fields';
import { columnSpanField } from '../column-span.field';
import { defaultGap, gapFields, gapLayoutSchema } from '../gap.field';
import {
  itemsAlignmentFields,
  itemsAlignmentSchema,
} from '../items-alignment.field';

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
      'A flexible 12-column grid layout. Each entry in items is a cell with its own column span and row span per breakpoint, an optional visibility list of the breakpoints the cell is shown on and a content slot for nested components. The layout field sets per breakpoint the column and row gap in theme spacing units (or exact pixel strings like "12px") and alignItems (start, center, end or stretch), the vertical alignment of the cells within a row, and justifyContent (start, center, end, space-between, space-around or space-evenly), the horizontal distribution of the columns. Use it for multi-column arrangements of mixed content.',
  },
  fields: {
    layout: {
      type: 'breakpoints',
      label: 'Layout',
      hideLabel: true,
      objectFields: {
        ...gapFields(),
        ...itemsAlignmentFields,
      },
      ai: breakpointsFieldAi({
        ...gapLayoutSchema(),
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
        gap: defaultGap,
        alignItems: 'stretch',
        justifyContent: 'start',
      },
    },
    items: [defaultItem, defaultItem],
  },
  render: editorRender(DynamicGridRender, { minEmptyHeight: 100 }),
};
