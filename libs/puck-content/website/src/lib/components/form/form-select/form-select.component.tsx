import { TextField } from '@mui/material';

import { PuckBlockComponent } from '../../../blocks/block.types';
import { FormField } from '../form-field.component';
import { FormOption } from '../form-option';

export type FormSelectProps = {
  name: string;
  label: string;
  options: FormOption[];
  placeholder?: string;
  required?: boolean;
  defaultValue?: string;
  helperText?: string;
};

export const FormSelectRender: PuckBlockComponent<FormSelectProps> = ({
  className,
  props: {
    name,
    label,
    options,
    placeholder,
    required,
    defaultValue,
    helperText,
  },
}) => (
  <FormField className={className}>
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
