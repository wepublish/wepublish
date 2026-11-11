import {
  IconButton,
  InputAdornment,
  TextField as MuiTextField,
} from '@mui/material';
import { useField } from '@wepublish/form/core';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdVisibility, MdVisibilityOff } from 'react-icons/md';

import { textFieldProps } from '../field-anatomy';

export type SecretFieldProps = {
  autoComplete?: string;
};

export function SecretField({
  autoComplete = 'one-time-code',
}: SecretFieldProps) {
  const { t } = useTranslation();
  const { ref, ...field } = useField<string | null | undefined>();
  const [visible, setVisible] = useState(false);

  return (
    <MuiTextField
      {...textFieldProps(field, {
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                edge="end"
                aria-label={
                  visible ? t('form.secret.hide') : t('form.secret.show')
                }
                onClick={() => setVisible(!visible)}
                disabled={field.disabled}
              >
                {visible ?
                  <MdVisibilityOff />
                : <MdVisibility />}
              </IconButton>
            </InputAdornment>
          ),
        },
      })}
      type={visible ? 'text' : 'password'}
      autoComplete={autoComplete}
      inputRef={ref}
      value={field.value ?? ''}
      onChange={event => field.onChange(event.target.value)}
      onBlur={field.onBlur}
    />
  );
}
