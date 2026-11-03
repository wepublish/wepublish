import { TextField } from '@mui/material';

import { PuckBlockComponent } from '../../../blocks/block.types';
import { FormField } from '../form-field.component';

export type FormTextareaProps = {
  name: string;
  label: string;
  rows?: number;
  placeholder?: string;
  required?: boolean;
  defaultValue?: string;
  helperText?: string;
};

export const FormTextareaRender: PuckBlockComponent<FormTextareaProps> = ({
  className,
  props: { name, label, rows, placeholder, required, defaultValue, helperText },
}) => (
  <FormField className={className}>
    <TextField
      key={defaultValue}
      fullWidth
      multiline
      rows={rows || 4}
      name={name}
      label={label}
      placeholder={placeholder || undefined}
      required={required}
      defaultValue={defaultValue || undefined}
      helperText={helperText || undefined}
      slotProps={placeholder ? { inputLabel: { shrink: true } } : undefined}
    />
  </FormField>
);
