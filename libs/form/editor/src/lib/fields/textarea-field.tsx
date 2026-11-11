import { TextField as MuiTextField } from '@mui/material';
import { useField } from '@wepublish/form/core';

import { textFieldProps } from '../field-anatomy';

export type TextareaFieldProps = {
  minRows?: number;
  maxRows?: number;
};

export function TextareaField({ minRows = 3, maxRows }: TextareaFieldProps) {
  const { ref, ...field } = useField<string | null | undefined>();

  return (
    <MuiTextField
      {...textFieldProps(field)}
      multiline
      minRows={minRows}
      maxRows={maxRows}
      inputRef={ref}
      value={field.value ?? ''}
      onChange={event => field.onChange(event.target.value)}
      onBlur={field.onBlur}
    />
  );
}
