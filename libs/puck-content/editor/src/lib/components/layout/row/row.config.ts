import { ComponentConfig } from '@puckeditor/core';
import { RowProps, RowRender } from '@wepublish/puck-content/website';
import { MdAutoAwesomeMosaic } from 'react-icons/md';

import { editorRender } from '../../../blocks/editor-render';
import { breakpointsFieldAi } from '../../../breakpoints/breakpoints.field';
import { UserFields } from '../../../fields';
import { defaultGap, gapFields, gapLayoutSchema } from '../gap.field';
import {
  itemsAlignmentFields,
  itemsAlignmentSchema,
} from '../items-alignment.field';

export const Row: ComponentConfig<{
  props: RowProps;
  fields: UserFields;
}> = {
  icon: MdAutoAwesomeMosaic,
  category: 'layout',
  order: 4,
  nameKey: 'puck.blocks.names.Row',
  ai: {
    instructions:
      'A single horizontal row that places all nested components side by side, each sized by its own content. Put components into the content slot. The layout field sets per breakpoint the column gap between the components in theme spacing units (or exact pixel strings like "12px") and alignItems (start, center, end or stretch), the vertical alignment of the components within the row, and justifyContent (start, center, end, space-between, space-around or space-evenly), their horizontal distribution. Use it for inline arrangements such as a button next to a text or several small elements in one line. For column layouts with fixed widths use Grid or DynamicGrid instead.',
  },
  fields: {
    content: {
      type: 'slot',
    },
    layout: {
      type: 'breakpoints',
      label: 'Layout',
      hideLabel: true,
      objectFields: {
        ...gapFields(['column']),
        ...itemsAlignmentFields,
      },
      ai: breakpointsFieldAi({
        ...gapLayoutSchema(['column']),
        ...itemsAlignmentSchema,
      }),
    },
  },
  defaultProps: {
    content: [],
    layout: {
      xs: {
        gap: { column: defaultGap.column },
        alignItems: 'center',
        justifyContent: 'start',
      },
    },
  },
  render: editorRender(RowRender, { minEmptyHeight: 100 }),
};
