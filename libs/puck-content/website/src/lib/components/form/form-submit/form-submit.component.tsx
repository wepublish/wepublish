import { Button, ButtonOwnProps } from '@mui/material';
import { PuckComponent } from '@puckeditor/core';

import { FormField } from '../form-field.component';

export type FormSubmitVariant = 'contained' | 'outlined' | 'text';

export type FormSubmitProps = {
  className?: string;
  label: string;
  color?: ButtonOwnProps['color'];
  variant?: FormSubmitVariant;
  fullWidth?: boolean;
};

export const FormSubmitRender: PuckComponent<FormSubmitProps> = ({
  className,
  label,
  color,
  variant,
  fullWidth,
  puck: { isEditing },
}) => (
  <FormField
    className={className}
    isEditing={isEditing}
  >
    <Button
      type="submit"
      color={color}
      variant={variant}
      fullWidth={fullWidth}
    >
      {label}
    </Button>
  </FormField>
);
