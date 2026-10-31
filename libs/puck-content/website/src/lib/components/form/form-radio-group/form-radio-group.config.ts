import { ComponentConfig } from '@puckeditor/core';

import { switchFieldAi } from '@wepublish/puck-content/editor';
import { UserFields } from '../../../types';
import {
  formFieldNameField,
  formHelperTextField,
  formLabelField,
  formRequiredField,
} from '../form-field-fields';
import { defaultFormOptions, formOptionsField } from '../form-options';
import {
  FormRadioGroupProps,
  FormRadioGroupRender,
} from './form-radio-group.component';

export const FormRadioGroupConfig: ComponentConfig<{
  props: FormRadioGroupProps;
  fields: UserFields;
}> = {
  label: 'Radio group',
  ai: {
    instructions:
      'A group of radio buttons placed inside a Form to pick exactly one of two to four options; the chosen option value is sent under name. Use a FormSelect for longer lists.',
  },
  fields: {
    name: formFieldNameField,
    label: formLabelField,
    options: formOptionsField,
    row: {
      type: 'switch',
      label: 'Side by side',
      ai: switchFieldAi(
        'Whether the options sit next to each other instead of stacked. Only for a few short options.'
      ),
    },
    required: formRequiredField,
    defaultValue: {
      type: 'text',
      label: 'Preselected value',
      ai: {
        instructions:
          'Value of the option that is selected initially. Leave empty so the reader has to choose.',
      },
    },
    helperText: formHelperTextField,
  },
  defaultProps: {
    name: 'choice',
    label: 'Choice',
    options: defaultFormOptions,
    row: false,
    required: false,
    defaultValue: '',
    helperText: '',
  },
  render: FormRadioGroupRender,
};
