import { TextField } from '@mui/material';
import { PuckComponent } from '@puckeditor/core';

import { FormField } from '../form-field.component';

export type FormTextareaProps = {
  className?: string;
  name: string;
  label: string;
  rows?: number;
  placeholder?: string;
  required?: boolean;
  defaultValue?: string;
  helperText?: string;
};

export const FormTextareaRender: PuckComponent<FormTextareaProps> = ({
  className,
  name,
  label,
  rows,
  placeholder,
  required,
  defaultValue,
  helperText,
  puck: { isEditing },
}) => (
  <FormField
    className={className}
    isEditing={isEditing}
  >
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
