import {IconButton, InputAdornment, Theme, css, styled} from '@mui/material'
import {DatePicker} from '@mui/x-date-pickers'
import {
  BuilderUserFormFields,
  BuilderUserFormProps,
  useWebsiteBuilder
} from '@wepublish/website/builder'
import {useReducer} from 'react'
import {Controller} from 'react-hook-form'
import {MdVisibility, MdVisibilityOff} from 'react-icons/md'

export const UserFormWrapper = styled('div')`
  display: grid;
  gap: ${({theme}) => theme.spacing(3)};
  grid-template-columns: 1fr;

  ${({theme}) => theme.breakpoints.up('md')} {
    grid-template-columns: 1fr 1fr;
  }
`

export const UserAddressWrapper = styled('div')`
  display: grid;
  gap: ${({theme}) => theme.spacing(3)};
  grid-template-columns: repeat(2, 1fr);

  ${({theme}) => theme.breakpoints.up('md')} {
    grid-column: 1 / -1;
    grid-template-columns: repeat(3, 1fr);
  }
`

export const UserPasswordWrapper = styled('div')`
  display: flex;
  flex: 1 0 50%;
  flex-flow: row;
  gap: ${({theme}) => theme.spacing(3)};

  ${({theme}) => theme.breakpoints.up('md')} {
    grid-column: 1 / -1;
  }
`

const addressStyles = (theme: Theme) => css`
  grid-column: 1 / -1;
`

const countryStyles = (theme: Theme) => css`
  ${theme.breakpoints.down('md')} {
    grid-column: 1 / -1;
  }
`

export function UserForm<T extends BuilderUserFormFields>({
  fields,
  className,
  control,
  hideEmail
}: BuilderUserFormProps<T>) {
  const [showPassword, togglePassword] = useReducer(state => !state, false)

  const {
    elements: {TextField}
  } = useWebsiteBuilder()

  const fieldsToDisplay = fields.reduce(
    (obj, field) => ({...obj, [field]: true}),
    {} as Record<BuilderUserFormFields, true>
  )

  return (
    <UserFormWrapper className={className}>
      {fieldsToDisplay.firstName && (
        <Controller
          name={'firstName'}
          control={control}
          render={({field, fieldState: {error}}) => (
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

      {fieldsToDisplay.preferredName && (
        <Controller
          name={'preferredName'}
          control={control}
          render={({field, fieldState: {error}}) => (
            <TextField
              {...field}
              value={field.value ?? ''}
              label={'Bevorzugter Name'}
              error={!!error}
              helperText={error?.message}
            />
          )}
        />
      )}

      {fieldsToDisplay.flair && (
        <Controller
          name={'flair'}
          control={control}
          render={({field, fieldState: {error}}) => (
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
        render={({field, fieldState: {error}}) => (
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
        <Controller
          name={'email'}
          control={control}
          render={({field, fieldState: {error}}) => (
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
      )}

      {fieldsToDisplay.birthday && (
        <Controller
          name={'birthday'}
          control={control}
          render={({field, fieldState: {error}}) => (
            <DatePicker
              {...field}
              value={field.value ?? null}
              label={'Geburtstag'}
              format="dd-MM-yyyy"
              disableFuture
              slotProps={{
                textField: {
                  error: !!error,
                  helperText: error?.message
                }
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
            render={({field, fieldState: {error}}) => (
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
                        edge="end">
                        {showPassword ? <MdVisibilityOff /> : <MdVisibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            )}
          />

          {fieldsToDisplay.passwordRepeated && (
            <Controller
              name={'passwordRepeated'}
              control={control}
              render={({field, fieldState: {error}}) => (
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
                          edge="end">
                          {showPassword ? <MdVisibilityOff /> : <MdVisibility />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              )}
            />
          )}
        </UserPasswordWrapper>
      )}

      {fieldsToDisplay.address && (
        <UserAddressWrapper>
          <Controller
            name={'address.streetAddress'}
            control={control}
            render={({field, fieldState: {error}}) => (
              <TextField
                {...field}
                value={field.value ?? ''}
                css={theme => addressStyles(theme as Theme)}
                fullWidth
                label={'Strasse und Hausnummer'}
                error={!!error}
                helperText={error?.message}
                autoComplete="address"
              />
            )}
          />

          <Controller
            name={'address.zipCode'}
            control={control}
            render={({field, fieldState: {error}}) => (
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
            render={({field, fieldState: {error}}) => (
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
            render={({field, fieldState: {error}}) => (
              <TextField
                {...field}
                value={field.value ?? ''}
                fullWidth
                css={theme => countryStyles(theme as Theme)}
                label={'Land'}
                error={!!error}
                helperText={error?.message}
                autoComplete="country"
              />
            )}
          />
        </UserAddressWrapper>
      )}
    </UserFormWrapper>
  )
}
