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

export type TextFieldProps = {
  type?: 'text' | 'email' | 'url' | 'password';
  autoComplete?: string;
};

const FORMAT_TYPES: Readonly<Partial<Record<string, 'email' | 'url'>>> = {
  email: 'email',
  url: 'url',
};

export function TextField({ type, autoComplete }: TextFieldProps) {
  const { t } = useTranslation();
  const { ref, ...field } = useField<string | null | undefined>();
  const [visible, setVisible] = useState(false);
  const password = type === 'password';
  const inputType =
    password ?
      visible ? 'text'
      : 'password'
    : (type ?? FORMAT_TYPES[field.info.format ?? ''] ?? 'text');

  return (
    <MuiTextField
      {...textFieldProps(field, {
        input:
          password ?
            {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    edge="end"
                    aria-label={
                      visible ?
                        t('form.password.hide')
                      : t('form.password.show')
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
            }
          : {},
      })}
      type={inputType}
      autoComplete={autoComplete}
      inputRef={ref}
      value={field.value ?? ''}
      onChange={event => field.onChange(event.target.value)}
      onBlur={field.onBlur}
    />
  );
}
