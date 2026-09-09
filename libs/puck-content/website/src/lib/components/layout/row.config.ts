import { ComponentConfig } from '@puckeditor/core';

import { alignmentFieldAi } from '@wepublish/puck-content/editor';
import { UserFields } from '../../types';
import { RowProps, RowRender } from './row.component';

export const Row: ComponentConfig<{
  props: RowProps;
  fields: UserFields;
}> = {
  ai: {
    instructions:
      'A single horizontal row that places all nested components side by side, each sized by its own content. Put components into the content slot; alignItems (start, center or end) controls their vertical alignment within the row. Use it for inline arrangements such as a button next to a text or several small elements in one line. For column layouts with fixed widths use Grid or DynamicGrid instead.',
  },
  fields: {
    content: {
      type: 'slot',
    },
    alignItems: {
      type: 'alignment',
      alignments: ['start', 'center', 'end'],
      ai: alignmentFieldAi(['start', 'center', 'end']),
    },
  },
  defaultProps: {
    content: [],
    alignItems: 'center',
  },
  render: RowRender,
};
