import { ComponentConfig } from '@puckeditor/core';
import {
  ButtonConfigProps,
  ButtonRender,
} from '@wepublish/puck-content/website';
import { MdSmartButton } from 'react-icons/md';

import { editorRender } from '../../../blocks/editor-render';
import { paletteFieldAi } from '../../../palette/palette.field';
import { switchFieldAi } from '../../../switch/switch.field';
import { UserFields } from '../../../fields';

export const ButtonConfig: ComponentConfig<{
  props: ButtonConfigProps;
  fields: UserFields;
}> = {
  icon: MdSmartButton,
  category: 'text',
  order: 5,
  nameKey: 'puck.blocks.names.Button',
  ai: {
    instructions:
      'A call-to-action button. Use it to prompt the reader to take an action. The text field is the button label; variant chooses the visual style (contained, outlined or text), color picks a palette colour, and alignment positions the button (start, center or end).',
  },
  fields: {
    text: {
      type: 'text',
      contentEditable: true,
    },
    color: {
      type: 'palette',
      ai: paletteFieldAi(),
    },
    variant: {
      label: 'Variant',
      type: 'select',
      options: [
        { label: 'Contained', value: 'contained' },
        { label: 'Outlined', value: 'outlined' },
        { label: 'Text', value: 'text' },
      ],
    },
    elevated: {
      type: 'switch',
      label: 'Elevated',
      ai: switchFieldAi(
        'Whether the button is raised with a shadow instead of flat.'
      ),
    },
  },
  resolveFields: async (data, params) => {
    if (data.props.variant === 'contained') {
      return params.fields;
    }

    const { elevated: _elevated, ...fields } = params.fields;

    return fields;
  },
  defaultProps: {
    text: 'Hello, world',
    variant: 'contained',
    elevated: true,
  },

  inline: true,
  render: editorRender(ButtonRender, { inline: true }),
};
