import { ComponentConfig } from '@puckeditor/core';

import { UserFields } from '../../../types';
import { formFieldNameField } from '../form-field-fields';
import { FormHiddenProps, FormHiddenRender } from './form-hidden.component';

export const FormHiddenConfig: ComponentConfig<{
  props: FormHiddenProps;
  fields: UserFields;
}> = {
  label: 'Hidden field',
  ai: {
    instructions:
      'An invisible input placed inside a Form that always sends a fixed value under name, e.g. a SOURCE or campaign tag for Mailchimp. Readers never see it.',
  },
  fields: {
    name: formFieldNameField,
    value: {
      type: 'text',
      label: 'Value',
      ai: {
        instructions: 'The fixed value that is always sent, e.g. website.',
      },
    },
  },
  defaultProps: {
    name: 'SOURCE',
    value: 'website',
  },
  render: FormHiddenRender,
};
