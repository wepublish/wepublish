import { ComponentConfig } from '@puckeditor/core';
import {
  defaultFormOptions,
  FormRadioGroupProps,
  FormRadioGroupRender,
} from '@wepublish/puck-content/website';
import { MdRadioButtonChecked } from 'react-icons/md';

import { editorRender } from '../../../blocks/editor-render';
import { switchFieldAi } from '../../../switch/switch.field';
import { UserFields } from '../../../fields';
import {
  formFieldNameField,
  formHelperTextField,
  formLabelField,
  formRequiredField,
} from '../form-field-fields';
import { decorateFormField } from '../form-editor-warning';
import { formOptionsField } from '../form-options.field';

export const FormRadioGroupConfig: ComponentConfig<{
  props: FormRadioGroupProps;
  fields: UserFields;
}> = {
  label: 'Radio group',
  icon: MdRadioButtonChecked,
  category: 'form',
  group: 'formFields',
  order: 5,
  nameKey: 'puck.blocks.names.FormRadioGroup',
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
  render: editorRender(FormRadioGroupRender, { decorate: decorateFormField }),
};
