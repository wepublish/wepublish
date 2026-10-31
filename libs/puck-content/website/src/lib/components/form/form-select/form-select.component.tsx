import { TextField } from '@mui/material';
import { PuckComponent } from '@puckeditor/core';

import { FormField } from '../form-field.component';
import { FormOption } from '../form-options';

export type FormSelectProps = {
  className?: string;
  name: string;
  label: string;
  options: FormOption[];
  placeholder?: string;
  required?: boolean;
  defaultValue?: string;
  helperText?: string;
};

export const FormSelectRender: PuckComponent<FormSelectProps> = ({
  className,
  name,
  label,
  options,
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
      select
      fullWidth
      name={name}
      label={label}
      required={required}
      defaultValue={defaultValue ?? ''}
      helperText={helperText || undefined}
      slotProps={{
        select: { native: true },
        inputLabel: { shrink: true },
      }}
    >
      <option value="">{placeholder ?? ''}</option>

      {options.map((option, index) => (
        <option
          key={`${index}-${option.value}`}
          value={option.value}
        >
          {option.label || option.value}
        </option>
      ))}
    </TextField>
  </FormField>
);
