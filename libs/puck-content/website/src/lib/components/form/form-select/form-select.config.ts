import { ComponentConfig } from '@puckeditor/core';

import { UserFields } from '../../../types';
import {
  formFieldNameField,
  formHelperTextField,
  formLabelField,
  formRequiredField,
} from '../form-field-fields';
import { defaultFormOptions, formOptionsField } from '../form-options';
import { FormSelectProps, FormSelectRender } from './form-select.component';

export const FormSelectConfig: ComponentConfig<{
  props: FormSelectProps;
  fields: UserFields;
}> = {
  label: 'Select',
  ai: {
    instructions:
      'A dropdown placed inside a Form to pick exactly one of a fixed list of options; the chosen option value is sent under name. Prefer a FormRadioGroup for two to four options.',
  },
  fields: {
    name: formFieldNameField,
    label: formLabelField,
    options: formOptionsField,
    placeholder: {
      type: 'text',
      label: 'Empty choice text',
      ai: {
        instructions:
          'Text of the empty first choice shown before the reader picks one, e.g. "Please choose".',
      },
    },
    required: formRequiredField,
    defaultValue: {
      type: 'text',
      label: 'Preselected value',
      ai: {
        instructions:
          'Value of the option that is selected initially. Leave empty to start on the empty choice.',
      },
    },
    helperText: formHelperTextField,
  },
  defaultProps: {
    name: 'choice',
    label: 'Choice',
    options: defaultFormOptions,
    placeholder: 'Please choose',
    required: false,
    defaultValue: '',
    helperText: '',
  },
  render: FormSelectRender,
};
