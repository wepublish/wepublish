import { ComponentConfig } from '@puckeditor/core';

import { switchFieldAi } from '@wepublish/puck-content/editor';
import { UserFields } from '../../../types';
import {
  CollapsibleConfigProps,
  CollapsibleRender,
} from './collapsible.component';

export const CollapsibleConfig: ComponentConfig<{
  props: CollapsibleConfigProps;
  fields: UserFields;
}> = {
  ai: {
    instructions:
      'An expandable section with a clickable title that reveals or hides its nested content, like an accordion item or FAQ entry. Place other components inside its content slot. Use defaultOpen to decide whether the content is visible before the reader interacts with it.',
  },
  fields: {
    title: {
      type: 'text',
      contentEditable: true,
      ai: {
        instructions:
          'Short heading shown on the clickable bar, for example a question in an FAQ.',
      },
    },
    defaultOpen: {
      type: 'switch',
      label: 'Open by default',
      ai: switchFieldAi(
        'Whether the content is expanded when the page loads. Usually false so the reader opens it on demand.'
      ),
    },
    content: {
      type: 'slot',
    },
  },
  defaultProps: {
    title: 'Mehr erfahren',
    defaultOpen: false,
    content: [],
  },
  render: CollapsibleRender,
};
