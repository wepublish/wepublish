import { TextField } from '@puckeditor/core';

import { SwitchField, switchFieldAi } from '@wepublish/puck-content/editor';

export const formFieldNameField = {
  type: 'text',
  label: 'Field name',
  ai: {
    instructions:
      'The key the value is sent under to the action URL, exactly as the receiving service expects it (Mailchimp: EMAIL, FNAME, LNAME or a group key). Must be unique within the form.',
  },
} satisfies TextField;

export const formLabelField = {
  type: 'text',
  label: 'Label',
  ai: {
    instructions: 'Short visible label telling the reader what to enter.',
  },
} satisfies TextField;

export const formHelperTextField = {
  type: 'text',
  label: 'Help text',
  ai: {
    instructions:
      'Optional one-line hint below the field, e.g. how the data is used. Leave empty when the label says enough.',
  },
} satisfies TextField;

export const formRequiredField = {
  type: 'switch',
  label: 'Required',
  ai: switchFieldAi(
    'Whether the reader has to fill in or tick this field before the form can be sent.'
  ),
} satisfies SwitchField;
