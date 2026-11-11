import { TextField, TextFieldProps } from '@mui/material';
import { forwardRef } from 'react';

export const Textarea = forwardRef<HTMLTextAreaElement, TextFieldProps>(
  (props, ref) => (
    <TextField
      {...props}
      inputRef={ref}
      multiline
      fullWidth
    />
  )
);
