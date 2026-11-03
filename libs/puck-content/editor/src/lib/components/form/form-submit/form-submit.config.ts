import { ComponentConfig } from '@puckeditor/core';
import {
  FormSubmitProps,
  FormSubmitRender,
  FormSubmitVariant,
} from '@wepublish/puck-content/website';
import { MdSend } from 'react-icons/md';

import { editorRender } from '../../../blocks/editor-render';
import { paletteFieldAi } from '../../../palette/palette.field';
import { switchFieldAi } from '../../../switch/switch.field';
import { UserFields } from '../../../fields';
import { decorateFormField } from '../form-editor-warning';

const variantOptions: { label: string; value: FormSubmitVariant }[] = [
  { label: 'Contained', value: 'contained' },
  { label: 'Outlined', value: 'outlined' },
  { label: 'Text', value: 'text' },
];

export const FormSubmitConfig: ComponentConfig<{
  props: FormSubmitProps;
  fields: UserFields;
}> = {
  label: 'Submit button',
  icon: MdSend,
  category: 'form',
  group: 'formFields',
  order: 7,
  nameKey: 'puck.blocks.names.FormSubmit',
  ai: {
    instructions:
      'The button that sends its Form to the action URL. Place exactly one as the last block of every Form and label it with the action, e.g. "Subscribe".',
  },
  fields: {
    label: {
      type: 'text',
      label: 'Label',
      ai: {
        instructions:
          'Short verb telling the reader what happens, e.g. Subscribe or Send.',
      },
    },
    color: {
      type: 'palette',
      label: 'Color',
      ai: paletteFieldAi(),
    },
    variant: {
      type: 'select',
      label: 'Variant',
      options: variantOptions,
    },
    fullWidth: {
      type: 'switch',
      label: 'Full width',
      ai: switchFieldAi(
        'Whether the button spans the whole width of the form instead of fitting its label.'
      ),
    },
  },
  defaultProps: {
    label: 'Send',
    color: 'primary',
    variant: 'contained',
    fullWidth: false,
  },
  render: editorRender(FormSubmitRender, { decorate: decorateFormField }),
};
