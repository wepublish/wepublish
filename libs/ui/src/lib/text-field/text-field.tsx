import { TextField as MuiTextField } from '@mui/material';
import { ComponentProps, forwardRef } from 'react';

export type TextFieldProps = ComponentProps<typeof MuiTextField>;

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ children, ...props }, ref) => {
    return (
      <MuiTextField
        {...props}
        ref={ref}
      />
    );
  }
);
