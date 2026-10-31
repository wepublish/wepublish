import { ComponentConfig } from '@puckeditor/core';

import { UserFields } from '../../../types';
import {
  formFieldNameField,
  formHelperTextField,
  formLabelField,
  formRequiredField,
} from '../form-field-fields';
import {
  FormTextareaProps,
  FormTextareaRender,
} from './form-textarea.component';

export const FormTextareaConfig: ComponentConfig<{
  props: FormTextareaProps;
  fields: UserFields;
}> = {
  label: 'Text area',
  ai: {
    instructions:
      'A multi-line input placed inside a Form for longer answers such as a message or comment. name is the key sent to the action URL.',
  },
  fields: {
    name: formFieldNameField,
    label: formLabelField,
    rows: {
      type: 'number',
      label: 'Rows',
      min: 2,
      max: 20,
      ai: {
        instructions:
          'Visible height in lines of text, usually 4 to 8. It does not limit how much the reader can write.',
      },
    },
    placeholder: {
      type: 'text',
      label: 'Placeholder',
    },
    required: formRequiredField,
    defaultValue: {
      type: 'textarea',
      label: 'Prefilled value',
    },
    helperText: formHelperTextField,
  },
  defaultProps: {
    name: 'message',
    label: 'Message',
    rows: 4,
    placeholder: '',
    required: false,
    defaultValue: '',
    helperText: '',
  },
  render: FormTextareaRender,
};
