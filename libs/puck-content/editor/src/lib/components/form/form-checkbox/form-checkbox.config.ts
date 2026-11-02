import { ComponentConfig } from '@puckeditor/core';
import {
  FormCheckboxProps,
  FormCheckboxRender,
} from '@wepublish/puck-content/website';
import { MdCheckBox } from 'react-icons/md';

import { editorRender } from '../../../blocks/editor-render';
import { switchFieldAi } from '../../../switch/switch.field';
import { UserFields } from '../../../fields';
import {
  formFieldNameField,
  formLabelField,
  formRequiredField,
} from '../form-field-fields';
import { decorateFormField } from '../form-editor-warning';

export const FormCheckboxConfig: ComponentConfig<{
  props: FormCheckboxProps;
  fields: UserFields;
}> = {
  label: 'Checkbox',
  icon: MdCheckBox,
  category: 'form',
  group: 'formFields',
  order: 3,
  nameKey: 'puck.blocks.names.FormCheckbox',
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
  render: editorRender(FormCheckboxRender, { decorate: decorateFormField }),
};
