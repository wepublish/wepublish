import {
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  Radio,
  RadioGroup,
} from '@mui/material';
import { PuckComponent } from '@puckeditor/core';
import { useId } from 'react';

import { FormField } from '../form-field.component';
import { FormOption } from '../form-options';

export type FormRadioGroupProps = {
  className?: string;
  name: string;
  label: string;
  options: FormOption[];
  row?: boolean;
  required?: boolean;
  defaultValue?: string;
  helperText?: string;
};

export const FormRadioGroupRender: PuckComponent<FormRadioGroupProps> = ({
  className,
  name,
  label,
  options,
  row,
  required,
  defaultValue,
  helperText,
  puck: { isEditing },
}) => {
  const labelId = useId();

  return (
    <FormField
      className={className}
      isEditing={isEditing}
    >
      <FormControl
        component="fieldset"
        required={required}
      >
        <FormLabel
          id={labelId}
          component="legend"
        >
          {label}
        </FormLabel>

        <RadioGroup
          key={defaultValue}
          aria-labelledby={labelId}
          name={name}
          row={row}
          defaultValue={defaultValue || undefined}
        >
          {options.map((option, index) => (
            <FormControlLabel
              key={`${index}-${option.value}`}
              value={option.value}
              label={option.label || option.value}
              control={<Radio required={required} />}
            />
          ))}
        </RadioGroup>

        {helperText && <FormHelperText>{helperText}</FormHelperText>}
      </FormControl>
    </FormField>
  );
};
