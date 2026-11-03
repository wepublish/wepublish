import { ComponentConfig, registerOverlayPortal } from '@puckeditor/core';
import {
  CollapsibleConfigProps,
  CollapsibleRender,
} from '@wepublish/puck-content/website';
import { MdUnfoldMore } from 'react-icons/md';

import { editorRender } from '../../../blocks/editor-render';
import { switchFieldAi } from '../../../switch/switch.field';
import { UserFields } from '../../../fields';

export const CollapsibleConfig: ComponentConfig<{
  props: CollapsibleConfigProps;
  fields: UserFields;
}> = {
  icon: MdUnfoldMore,
  category: 'layout',
  order: 6,
  nameKey: 'puck.blocks.names.Collapsible',
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
  render: editorRender(CollapsibleRender, {
    minEmptyHeight: 120,
    editingProps: () => ({ defaultOpen: true }),
    useExtra: () => ({ refs: { toggle: registerOverlayPortal } }),
  }),
};
