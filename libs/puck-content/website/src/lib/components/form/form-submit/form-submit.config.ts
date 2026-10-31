import { ComponentConfig } from '@puckeditor/core';

import { paletteFieldAi, switchFieldAi } from '@wepublish/puck-content/editor';
import { UserFields } from '../../../types';
import {
  FormSubmitProps,
  FormSubmitRender,
  FormSubmitVariant,
} from './form-submit.component';

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
      label: 'Colour',
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
  render: FormSubmitRender,
};
