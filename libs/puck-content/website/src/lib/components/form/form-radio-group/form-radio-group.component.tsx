import {
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  Radio,
  RadioGroup,
} from '@mui/material';
import { useId } from 'react';

import { PuckBlockComponent } from '../../../blocks/block.types';
import { FormField } from '../form-field.component';
import { FormOption } from '../form-option';

export type FormRadioGroupProps = {
  name: string;
  label: string;
  options: FormOption[];
  row?: boolean;
  required?: boolean;
  defaultValue?: string;
  helperText?: string;
};

export const FormRadioGroupRender: PuckBlockComponent<FormRadioGroupProps> = ({
  className,
  props: { name, label, options, row, required, defaultValue, helperText },
}) => {
  const labelId = useId();

  return (
    <FormField className={className}>
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
