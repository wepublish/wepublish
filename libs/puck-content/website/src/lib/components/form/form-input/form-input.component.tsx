import { TextField } from '@mui/material';

import { PuckBlockComponent } from '../../../blocks/block.types';
import { FormField } from '../form-field.component';

export type FormInputType =
  'text' | 'email' | 'tel' | 'number' | 'url' | 'date';

export type FormAutoComplete =
  | 'off'
  | 'name'
  | 'given-name'
  | 'family-name'
  | 'email'
  | 'tel'
  | 'organization'
  | 'street-address'
  | 'postal-code'
  | 'address-level2'
  | 'country-name'
  | 'bday';

export type FormInputProps = {
  name: string;
  label: string;
  type: FormInputType;
  placeholder?: string;
  required?: boolean;
  defaultValue?: string;
  autoComplete?: FormAutoComplete;
  helperText?: string;
};

export const FormInputRender: PuckBlockComponent<FormInputProps> = ({
  className,
  props: {
    name,
    label,
    type,
    placeholder,
    required,
    defaultValue,
    autoComplete,
    helperText,
  },
}) => (
  <FormField className={className}>
    <TextField
      key={defaultValue}
      fullWidth
      name={name}
      label={label}
      type={type}
      placeholder={placeholder || undefined}
      required={required}
      defaultValue={defaultValue || undefined}
      autoComplete={autoComplete}
      helperText={helperText || undefined}
      slotProps={
        type === 'date' || placeholder ?
          { inputLabel: { shrink: true } }
        : undefined
      }
    />
  </FormField>
);
