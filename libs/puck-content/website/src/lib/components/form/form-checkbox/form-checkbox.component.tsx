import { Checkbox, FormControlLabel } from '@mui/material';

import { PuckBlockComponent } from '../../../blocks/block.types';
import { FormField } from '../form-field.component';

export type FormCheckboxProps = {
  name: string;
  label: string;
  value?: string;
  required?: boolean;
  defaultChecked?: boolean;
};

export const FormCheckboxRender: PuckBlockComponent<FormCheckboxProps> = ({
  className,
  props: { name, label, value, required, defaultChecked },
}) => (
  <FormField className={className}>
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
