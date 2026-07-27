import { Button, ButtonOwnProps } from '@mui/material';
import { ComponentConfig } from '@puckeditor/core';

import { AlignmentValue } from '../../plugins/alignment';
import { UserFields } from '../../types';

export const ButtonConfig: ComponentConfig<{
  props: {
    text: string;
    color?: ButtonOwnProps['color'];
    variant?: ButtonOwnProps['variant'];
    elevated?: boolean;
    alignment?: AlignmentValue;
  };
  fields: UserFields;
}> = {
  ai: {
    instructions:
      'A call-to-action button. Use it to prompt the reader to take an action. The text field is the button label; variant chooses the visual style (contained, outlined or text), color picks a palette colour, and alignment positions the button (start, center or end).',
  },
  inline: true,
  fields: {
    text: {
      type: 'text',
      contentEditable: true,
    },
    alignment: {
      type: 'alignment',
      alignments: ['start', 'center', 'end'],
    },
    color: {
      type: 'palette',
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
  },
  resolveFields: async (data, params) => {
    let fields = params.fields;

    if (data.props.variant === 'contained') {
      fields = {
        ...fields,
        elevated: {
          type: 'radio',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
      };
    }

    return fields;
  },
  defaultProps: {
    text: 'Hello, world',
    variant: 'contained',
    elevated: true,
  },

  render: ({ text, alignment, variant, color, elevated }) => (
    <Button
      variant={variant}
      color={color}
      css={{ placeSelf: alignment }}
      disableElevation={!elevated}
    >
      {text}
    </Button>
  ),
};
