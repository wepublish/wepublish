import { ComponentConfig } from '@puckeditor/core';
import {
  defaultBreakpoints,
  DynamicGridItem,
  DynamicGridProps,
  DynamicGridRender,
} from '@wepublish/puck-content/website';

import { editorRender } from '../../../blocks/editor-render';
import { breakpointsFieldAi } from '../../../breakpoints/breakpoints.field';
import { visibilityFieldAi } from '../../../visibility/visibility.field';
import { UserFields } from '../../../fields';
import { defaultGap, gapFields, gapLayoutSchema } from '../gap.field';
import {
  defaultGridPlacement,
  gridPlacementField,
} from '../grid-placement.field';
import {
  itemsAlignmentFields,
  itemsAlignmentSchema,
} from '../items-alignment.field';

const defaultItem: DynamicGridItem = {
  placement: defaultGridPlacement,
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
      'A flexible 12-column grid layout. Each entry in items is a cell with a placement per breakpoint: column and row each take a start line (leave it out to flow after the previous cell, set it to offset the cell, e.g. start 3 to skip two columns) and a span (how many columns or rows it covers; start + span - 1 must not exceed 12 columns), an optional visibility list of the breakpoints the cell is shown on and a content slot for nested components. The layout field sets per breakpoint the column and row gap in theme spacing units (or exact pixel strings like "12px") and alignItems (start, center, end or stretch), the vertical alignment of the cells within a row, and justifyContent (start, center, end, space-between, space-around or space-evenly), the horizontal distribution of the columns. Use it for multi-column arrangements of mixed content.',
  },
  fields: {
    items: {
      type: 'array',
      label: 'Items',
      getItemSummary: (_item: DynamicGridItem, index = 0) =>
        `Item ${index + 1}`,
      defaultItemProps: defaultItem,
      arrayFields: {
        placement: gridPlacementField(),
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
