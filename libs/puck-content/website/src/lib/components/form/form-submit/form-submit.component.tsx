import { Button, ButtonOwnProps } from '@mui/material';

import { PuckBlockComponent } from '../../../blocks/block.types';
import { FormField } from '../form-field.component';

export type FormSubmitVariant = 'contained' | 'outlined' | 'text';

export type FormSubmitProps = {
  label: string;
  color?: ButtonOwnProps['color'];
  variant?: FormSubmitVariant;
  fullWidth?: boolean;
};

export const FormSubmitRender: PuckBlockComponent<FormSubmitProps> = ({
  className,
  props: { label, color, variant, fullWidth },
}) => (
  <FormField className={className}>
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
