import { ComponentConfig } from '@puckeditor/core';

import { switchFieldAi } from '@wepublish/puck-content/editor';
import { UserFields } from '../../../types';
import {
  formFieldNameField,
  formLabelField,
  formRequiredField,
} from '../form-field-fields';
import {
  FormCheckboxProps,
  FormCheckboxRender,
} from './form-checkbox.component';

export const FormCheckboxConfig: ComponentConfig<{
  props: FormCheckboxProps;
  fields: UserFields;
}> = {
  label: 'Checkbox',
  ai: {
    instructions:
      'A single checkbox placed inside a Form, e.g. a consent or a Mailchimp group choice. It only sends value under name while ticked; make consent checkboxes required and never tick them by default.',
  },
  fields: {
    name: formFieldNameField,
    label: formLabelField,
    value: {
      type: 'text',
      label: 'Submitted value',
      ai: {
        instructions:
          'Value sent while the box is ticked, e.g. 1 or yes. Mailchimp group checkboxes use the group value from the embed code.',
      },
    },
    required: formRequiredField,
    defaultChecked: {
      type: 'switch',
      label: 'Ticked by default',
      ai: switchFieldAi(
        'Whether the box starts ticked. Keep false for consent, which has to be given actively.'
      ),
    },
  },
  defaultProps: {
    name: 'consent',
    label: 'I agree to the privacy policy',
    value: 'yes',
    required: false,
    defaultChecked: false,
  },
  render: FormCheckboxRender,
};
