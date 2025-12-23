import { IconButton, InputAdornment, Theme, css } from '@mui/material';
import styled from '@emotion/styled';
import { MobileDatePicker } from '@mui/x-date-pickers';
import {
  BuilderUserFormFields,
  BuilderUserFormProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { useReducer } from 'react';
import { Controller } from 'react-hook-form';
import { MdVisibility, MdVisibilityOff } from 'react-icons/md';
import { CountrySelect } from './country-select';

export const UserFormWrapper = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(3)};
  grid-template-columns: 1fr;

  ${({ theme }) => theme.breakpoints.up('md')} {
    grid-template-columns: 1fr 1fr;
  }
`;

export const UserAddressWrapper = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(3)};
  grid-template-columns: repeat(2, 1fr);

  ${({ theme }) => theme.breakpoints.up('md')} {
    grid-column: 1 / -1;
    grid-template-columns: repeat(3, 1fr);
  }
`;

export const UserStreetWrapper = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(3)};
  grid-template-columns: 1fr ${({ theme }) => theme.spacing(15)};
  grid-column: 1 / -1;
`;

export const UserPasswordWrapper = styled('div')`
  display: flex;
  flex: 1 0 50%;
  flex-flow: row;
  gap: ${({ theme }) => theme.spacing(3)};

  ${({ theme }) => theme.breakpoints.up('md')} {
    grid-column: 1 / -1;
  }
`;

const countryStyles = (theme: Theme) => css`
  ${theme.breakpoints.down('md')} {
    grid-column: 1 / -1;
  }
`;

export function UserForm<T extends BuilderUserFormFields>({
  fields,
  className,
  control,
  hideEmail,
}: BuilderUserFormProps<T>) {
  const [showPassword, togglePassword] = useReducer(state => !state, false);

  const {
    elements: { TextField },
  } = useWebsiteBuilder();

  const fieldsToDisplay = fields.reduce(
    (obj, field) => ({ ...obj, [field]: true }),
    {} as Record<BuilderUserFormFields, true>
  );

  return (
    <UserFormWrapper className={className}>
      {fieldsToDisplay.firstName && (
        <Controller
          name={'firstName'}
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField
              {...field}
              value={field.value ?? ''}
              label={'Vorname'}
              error={!!error}
              helperText={error?.message}
              autoComplete="firstname"
            />
          )}
        />
      )}

      {fieldsToDisplay.flair && (
        <Controller
          name={'flair'}
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField
              {...field}
              label={'Funktion / Beruf'}
              error={!!error}
              helperText={error?.message}
            />
          )}
        />
      )}

      <Controller
        name={'name'}
        control={control}
        render={({ field, fieldState: { error } }) => (
          <TextField
            {...field}
            value={field.value ?? ''}
            label={'Nachname'}
            error={!!error}
            helperText={error?.message}
            autoComplete="lastname"
          />
        )}
      />

      {!hideEmail && (
        <>
          <Controller
            name={'email'}
            control={control}
            render={({ field, fieldState: { error } }) => (
              <TextField
                {...field}
                value={field.value ?? ''}
                autoComplete="email"
                type={'email'}
                fullWidth
                label={'Email'}
                error={!!error}
                helperText={error?.message}
              />
            )}
          />

          {fieldsToDisplay.emailRepeated && (
            <Controller
              name={'emailRepeated'}
              control={control}
              render={({ field, fieldState: { error } }) => (
                <TextField
                  {...field}
                  value={field.value ?? ''}
                  type={'email'}
                  fullWidth
                  label={'Email wiederholen'}
                  error={!!error}
                  helperText={error?.message}
                />
              )}
            />
          )}
        </>
      )}

      {fieldsToDisplay.birthday && (
        <Controller
          name={'birthday'}
          control={control}
          render={({ field, fieldState: { error } }) => (
            <MobileDatePicker
              {...field}
              value={field.value ? new Date(field.value) : null}
              onClose={field.onBlur}
              label={'Geburtstag'}
              format="PP"
              openTo="year"
              views={['year', 'month', 'day']}
              disableFuture
              slotProps={{
                field: { clearable: true, ref: field.ref },
                textField: {
                  error: !!error,
                  helperText: error?.message,
                },
              }}
            />
          )}
        />
      )}

      {fieldsToDisplay.password && (
        <UserPasswordWrapper>
          <Controller
            name={'password'}
            control={control}
            render={({ field, fieldState: { error } }) => (
              <TextField
                {...field}
                value={field.value ?? ''}
                autoComplete="new-password"
                type={showPassword ? 'text' : 'password'}
                fullWidth
                label={'Passwort'}
                error={!!error}
                helperText={error?.message}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={togglePassword}
                        onMouseDown={event => event.preventDefault()}
                        edge="end"
                      >
                        {showPassword ?
                          <MdVisibilityOff />
                        : <MdVisibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            )}
          />

          {fieldsToDisplay.passwordRepeated && (
            <Controller
              name={'passwordRepeated'}
              control={control}
              render={({ field, fieldState: { error } }) => (
                <TextField
                  {...field}
                  value={field.value ?? ''}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  fullWidth
                  label={'Passwort wiederholen'}
                  error={!!error}
                  helperText={error?.message}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={togglePassword}
                          onMouseDown={event => event.preventDefault()}
                          edge="end"
                        >
                          {showPassword ?
                            <MdVisibilityOff />
                          : <MdVisibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              )}
            />
          )}
        </UserPasswordWrapper>
      )}

      {fieldsToDisplay.address && (
        <UserAddressWrapper>
          <UserStreetWrapper>
            <Controller
              name={'address.streetAddress'}
              control={control}
              render={({ field, fieldState: { error } }) => (
                <TextField
                  {...field}
                  value={field.value ?? ''}
                  fullWidth
                  label={'Strasse'}
                  error={!!error}
                  helperText={error?.message}
                  autoComplete="address"
                />
              )}
            />

            <Controller
              name={'address.streetAddressNumber'}
              control={control}
              render={({ field, fieldState: { error } }) => (
                <TextField
                  {...field}
                  value={field.value ?? ''}
                  fullWidth
                  label={'Hausnummer'}
                  error={!!error}
                  helperText={error?.message}
                  autoComplete="house number"
                />
              )}
            />
          </UserStreetWrapper>

          <Controller
            name={'address.zipCode'}
            control={control}
            render={({ field, fieldState: { error } }) => (
              <TextField
                {...field}
                value={field.value ?? ''}
                fullWidth
                label={'PLZ'}
                error={!!error}
                helperText={error?.message}
                autoComplete="zip"
              />
            )}
          />

          <Controller
            name={'address.city'}
            control={control}
            render={({ field, fieldState: { error } }) => (
              <TextField
                {...field}
                value={field.value ?? ''}
                fullWidth
                label={'Ort / Stadt'}
                error={!!error}
                helperText={error?.message}
                autoComplete="city"
              />
            )}
          />

          <Controller
            name={'address.country'}
            control={control}
            render={({ field, fieldState: { error } }) => (
              <CountrySelect
                {...field}
                value={field.value ?? ''}
                onChange={field.onChange}
                css={theme => countryStyles(theme as Theme)}
                error={!!error}
                helperText={error?.message}
              />
            )}
          />
        </UserAddressWrapper>
      )}
    </UserFormWrapper>
  );
}
