import { ComponentConfig } from '@puckeditor/core';
import {
  defaultFormOptions,
  FormSelectProps,
  FormSelectRender,
} from '@wepublish/puck-content/website';

import { editorRender } from '../../../blocks/editor-render';
import { UserFields } from '../../../fields';
import {
  formFieldNameField,
  formHelperTextField,
  formLabelField,
  formRequiredField,
} from '../form-field-fields';
import { decorateFormField } from '../form-editor-warning';
import { formOptionsField } from '../form-options.field';

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
  render: editorRender(FormSelectRender, { decorate: decorateFormField }),
};
