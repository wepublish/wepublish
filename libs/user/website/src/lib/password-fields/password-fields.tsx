import { InputAdornment } from '@mui/material';
import { useWebsiteBuilder } from '@wepublish/website/builder';
import { ReactNode, useReducer } from 'react';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { MdVisibility, MdVisibilityOff } from 'react-icons/md';

export type PasswordFieldsProps<T extends FieldValues> = {
  control: Control<T>;
  /** Shown above the fields. */
  note?: ReactNode;
};

/**
 * The new password and its repetition, each with a toggle to show it. For
 * forms whose values have `password` and `passwordRepeated`.
 */
export function PasswordFields<T extends FieldValues>({
  control,
  note,
}: PasswordFieldsProps<T>) {
  const {
    elements: { TextField, IconButton },
  } = useWebsiteBuilder();
  const { t } = useTranslation();
  const [showPassword, togglePassword] = useReducer(state => !state, false);
  const [showRepeatPassword, toggleRepeatPassword] = useReducer(
    state => !state,
    false
  );

  const field = (
    name: 'password' | 'passwordRepeated',
    label: string,
    shown: boolean,
    toggle: () => void
  ) => (
    <Controller
      name={name as Path<T>}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <TextField
          {...field}
          value={field.value ?? ''}
          type={shown ? 'text' : 'password'}
          fullWidth
          autoComplete="new-password"
          label={label}
          error={!!error}
          helperText={error?.message}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={toggle}
                    onMouseDown={event => event.preventDefault()}
                    edge="end"
                  >
                    {shown ?
                      <MdVisibilityOff />
                    : <MdVisibility />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />
      )}
    />
  );

  return (
    <>
      {note}
      {field('password', t('user.password'), showPassword, togglePassword)}
      {field(
        'passwordRepeated',
        t('user.passwordRepeat'),
        showRepeatPassword,
        toggleRepeatPassword
      )}
    </>
  );
}
