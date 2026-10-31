import { ComponentConfig } from '@puckeditor/core';

import { UserFields } from '../../../types';
import {
  formFieldNameField,
  formHelperTextField,
  formLabelField,
  formRequiredField,
} from '../form-field-fields';
import {
  FormAutoComplete,
  FormInputProps,
  FormInputRender,
  FormInputType,
} from './form-input.component';

const inputTypeOptions: { label: string; value: FormInputType }[] = [
  { label: 'Text', value: 'text' },
  { label: 'Email', value: 'email' },
  { label: 'Phone', value: 'tel' },
  { label: 'Number', value: 'number' },
  { label: 'URL', value: 'url' },
  { label: 'Date', value: 'date' },
];

const autoCompleteOptions: {
  label: string;
  value: FormAutoComplete | undefined;
}[] = [
  { label: 'Browser decides', value: undefined },
  { label: 'Off', value: 'off' },
  { label: 'Full name', value: 'name' },
  { label: 'First name', value: 'given-name' },
  { label: 'Last name', value: 'family-name' },
  { label: 'Email', value: 'email' },
  { label: 'Phone', value: 'tel' },
  { label: 'Organisation', value: 'organization' },
  { label: 'Street address', value: 'street-address' },
  { label: 'Postal code', value: 'postal-code' },
  { label: 'City', value: 'address-level2' },
  { label: 'Country', value: 'country-name' },
  { label: 'Birthday', value: 'bday' },
];

export const FormInputConfig: ComponentConfig<{
  props: FormInputProps;
  fields: UserFields;
}> = {
  label: 'Input',
  ai: {
    instructions:
      'A single-line input placed inside a Form. name is the key sent to the action URL (EMAIL, FNAME or LNAME for Mailchimp); use type email for e-mail addresses so browsers validate them, and set autoComplete so browsers can fill it in.',
  },
  fields: {
    name: formFieldNameField,
    label: formLabelField,
    type: {
      type: 'select',
      label: 'Type',
      options: inputTypeOptions,
    },
    placeholder: {
      type: 'text',
      label: 'Placeholder',
    },
    required: formRequiredField,
    defaultValue: {
      type: 'text',
      label: 'Prefilled value',
    },
    autoComplete: {
      type: 'select',
      label: 'Autofill',
      options: autoCompleteOptions,
    },
    helperText: formHelperTextField,
  },
  defaultProps: {
    name: 'name',
    label: 'Name',
    type: 'text',
    placeholder: '',
    required: false,
    defaultValue: '',
    autoComplete: undefined,
    helperText: '',
  },
  render: FormInputRender,
};
