import { Checkbox, FormControlLabel } from '@mui/material';
import { PuckComponent } from '@puckeditor/core';

import { FormField } from '../form-field.component';

export type FormCheckboxProps = {
  className?: string;
  name: string;
  label: string;
  value?: string;
  required?: boolean;
  defaultChecked?: boolean;
};

export const FormCheckboxRender: PuckComponent<FormCheckboxProps> = ({
  className,
  name,
  label,
  value,
  required,
  defaultChecked,
  puck: { isEditing },
}) => (
  <FormField
    className={className}
    isEditing={isEditing}
  >
    <FormControlLabel
      key={String(!!defaultChecked)}
      label={label}
      required={required}
      control={
        <Checkbox
          name={name}
          value={value || undefined}
          required={required}
          defaultChecked={defaultChecked}
        />
      }
    />
  </FormField>
);
