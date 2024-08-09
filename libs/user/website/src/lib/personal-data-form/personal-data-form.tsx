import {zodResolver} from '@hookform/resolvers/zod'
import {InputAdornment, Theme, css, styled, useTheme} from '@mui/material'
import {
  BuilderPersonalDataFormFields,
  BuilderPersonalDataFormProps,
  PersonalDataFormFields,
  useAsyncAction,
  useWebsiteBuilder
} from '@wepublish/website/builder'
import {useMemo, useReducer, useState} from 'react'
import {Controller, useForm} from 'react-hook-form'
import {MdVisibility, MdVisibilityOff} from 'react-icons/md'
import {OptionalKeysOf} from 'type-fest'
import {z} from 'zod'

export const PersonalDataFormWrapper = styled('form')`
  display: grid;
  gap: ${({theme}) => theme.spacing(3)};
`

export const PersonalDataInputForm = styled('div')`
  display: grid;
  gap: ${({theme}) => theme.spacing(3)};
  grid-template-columns: 1fr;

  ${({theme}) => theme.breakpoints.up('md')} {
    grid-template-columns: 1fr 1fr;
  }
`

export const PersonalDataAddressWrapper = styled('div')`
  display: grid;
  gap: ${({theme}) => theme.spacing(3)};
  grid-template-columns: repeat(2, 1fr);

  ${({theme}) => theme.breakpoints.up('md')} {
    grid-column-start: 1;
    grid-column-end: 3;
    grid-template-columns: repeat(3, 1fr);
  }
`

const addressStyles = (theme: Theme) => css`
  grid-column-start: 1;
  grid-column-end: 3;

  ${theme.breakpoints.up('md')} {
    grid-column-start: 1;
    grid-column-end: 4;
  }
`

const countryStyles = (theme: Theme) => css`
  ${theme.breakpoints.down('md')} {
    grid-column-start: 1;
    grid-column-end: 3;
  }
`

export const PersonalDataPasswordWrapper = styled('div')`
  position: relative;
  padding-top: ${({theme}) => theme.spacing(3)};
  margin-top: -${({theme}) => theme.spacing(2)};
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({theme}) => theme.spacing(3)};

  ${({theme}) => theme.breakpoints.up('md')} {
    grid-column-start: 1;
    grid-column-end: 3;
  }
`

const passwordNoteStyles = (theme: Theme) => css`
  font-size: ${theme.typography.caption.fontSize};
  position: absolute;
  top: 0;
`

export const PersonalDataEmailWrapper = styled('div')`
  grid-column: 1 / -1;
  display: grid;
  gap: ${({theme}) => theme.spacing(1)};
`

const buttonStyles = css`
  justify-self: flex-end;
`

const RequestEmail = styled('div')``

const requiredSchema = z.object({
  email: z.string().email().nonempty(),
  name: z.string().nonempty()
})

const defaultSchema = z.object({
  firstName: z.string().optional(),
  preferredName: z.string().optional(),
  flair: z.string().optional(),
  address: z.object({
    streetAddress: z.string().nonempty(),
    zipCode: z.string().nonempty(),
    city: z.string().nonempty(),
    country: z.string().nonempty()
  }),
  password: z.string().min(8).optional().or(z.literal('')),
  passwordRepeated: z.string().min(8).optional().or(z.literal('')),
  uploadImageInput: z.object({
    description: z.string().optional(),
    file: z.any(),
    filename: z.string().optional(),
    focalPoint: z.object({x: z.string(), y: z.string()}),
    license: z.string().optional(),
    link: z.string().optional(),
    source: z.string().optional(),
    tags: z.array(z.string()).optional(),
    title: z.string().optional()
  })
})

export function PersonalDataForm<T extends BuilderPersonalDataFormFields>({
  fields = ['firstName', 'name', 'flair', 'address', 'password', 'preferredName', 'image'] as T[],
  className,
  initialUser,
  schema = defaultSchema,
  onUpdate,
  onImageUpload,
  mediaEmail
}: BuilderPersonalDataFormProps<T>) {
  const {
    elements: {TextField, Alert, Button, Paragraph, ImageUpload, Link, IconButton}
  } = useWebsiteBuilder()
  const theme = useTheme()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error>()
  const callAction = useAsyncAction(setLoading, setError)
  const [showPassword, togglePassword] = useReducer(state => !state, false)
  const [showRepeatPassword, toggleRepeatPassword] = useReducer(state => !state, false)

  const fieldsToDisplay = useMemo(
    () =>
      fields.reduce(
        (obj, field) => ({...obj, [field]: true}),
        {} as Record<OptionalKeysOf<PersonalDataFormFields>, true>
      ),
    [fields]
  )

  const validationSchema = useMemo(
    () =>
      requiredSchema
        .merge(
          schema.pick({
            ...fieldsToDisplay,
            passwordRepeated: true
          })
        )
        .refine(data => data.password === data.passwordRepeated, {
          message: 'Passwörter stimmen nicht überein.',
          path: ['passwordRepeated']
        }),
    [fieldsToDisplay, schema]
  )

  const {handleSubmit, control} = useForm<PersonalDataFormFields>({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      address: {
        city: initialUser.address?.city || '',
        country: initialUser.address?.country || '',
        streetAddress: initialUser.address?.streetAddress || '',
        zipCode: initialUser.address?.zipCode || ''
      },
      email: initialUser.email || '',
      firstName: initialUser.firstName || '',
      preferredName: initialUser.preferredName || '',
      name: initialUser.name || '',
      flair: initialUser.flair || '',
      password: '',
      passwordRepeated: '',
      uploadImageInput: initialUser.image || {}
    },
    mode: 'onTouched',
    reValidateMode: 'onChange'
  })

  const onSubmit = handleSubmit(data => onUpdate && callAction(onUpdate)(data))

  return (
    <PersonalDataFormWrapper className={className} onSubmit={onSubmit}>
      <PersonalDataInputForm>
        {fieldsToDisplay.image && (
          <PersonalDataAddressWrapper>
            <Controller
              name={'uploadImageInput'}
              control={control}
              render={({field}) => (
                <ImageUpload
                  {...field}
                  image={initialUser.image}
                  onUpload={callAction(onImageUpload)}
                />
              )}
            />
          </PersonalDataAddressWrapper>
        )}

        {fieldsToDisplay.firstName && (
          <Controller
            name={'firstName'}
            control={control}
            render={({field, fieldState: {error}}) => (
              <TextField
                {...field}
                label={'Vorname'}
                autoComplete="firstname"
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
              label={'Nachname'}
              autoComplete="name"
              error={!!error}
              helperText={error?.message}
            />
          )}
        />

        {fieldsToDisplay.preferredName && (
          <Controller
            name={'preferredName'}
            control={control}
            render={({field, fieldState: {error}}) => (
              <TextField
                {...field}
                label={'Bevorzugter Name'}
                autoComplete="preferred-name"
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

        {fieldsToDisplay.address && (
          <PersonalDataAddressWrapper>
            <Controller
              name={'address.streetAddress'}
              control={control}
              render={({field, fieldState: {error}}) => (
                <TextField
                  {...field}
                  css={addressStyles(theme)}
                  fullWidth
                  autoComplete="address"
                  label={'Strasse und Hausnummer'}
                  error={!!error}
                  helperText={error?.message}
                />
              )}
            />

            <Controller
              name={'address.zipCode'}
              control={control}
              render={({field, fieldState: {error}}) => (
                <TextField
                  {...field}
                  fullWidth
                  autoComplete="zip"
                  label={'PLZ'}
                  error={!!error}
                  helperText={error?.message}
                />
              )}
            />

            <Controller
              name={'address.city'}
              control={control}
              render={({field, fieldState: {error}}) => (
                <TextField
                  {...field}
                  fullWidth
                  autoComplete="city"
                  label={'Ort / Stadt'}
                  error={!!error}
                  helperText={error?.message}
                />
              )}
            />

            <Controller
              name={'address.country'}
              control={control}
              render={({field, fieldState: {error}}) => (
                <TextField
                  {...field}
                  css={countryStyles(theme)}
                  fullWidth
                  autoComplete="country"
                  label={'Land'}
                  error={!!error}
                  helperText={error?.message}
                />
              )}
            />
          </PersonalDataAddressWrapper>
        )}

        {fieldsToDisplay.password && (
          <PersonalDataPasswordWrapper>
            <Controller
              name={'password'}
              control={control}
              render={({field, fieldState: {error}}) => (
                <>
                  <Paragraph css={passwordNoteStyles(theme)}>
                    Nur ausfüllen, wenn Sie das Passwort ändern möchten. Ansonsten leer lassen.
                  </Paragraph>

                  <TextField
                    {...field}
                    type={showPassword ? 'text' : 'password'}
                    fullWidth
                    autoComplete="new-password"
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
                </>
              )}
            />

            <Controller
              name={'passwordRepeated'}
              control={control}
              render={({field, fieldState: {error}}) => (
                <TextField
                  {...field}
                  type={showRepeatPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  fullWidth
                  label={'Passwort wiederholen'}
                  error={!!error}
                  helperText={error?.message}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={toggleRepeatPassword}
                          onMouseDown={event => event.preventDefault()}
                          edge="end">
                          {showRepeatPassword ? <MdVisibilityOff /> : <MdVisibility />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              )}
            />
          </PersonalDataPasswordWrapper>
        )}

        <PersonalDataEmailWrapper>
          <Controller
            name={'email'}
            control={control}
            render={({field, fieldState: {error}}) => (
              <TextField
                {...field}
                type={'email'}
                fullWidth
                disabled
                label={'Email (nicht bearbeitbar)'}
                error={!!error}
                helperText={error?.message}
              />
            )}
          />

          {mediaEmail && (
            <RequestEmail>
              <Link
                href={`mailto:${mediaEmail}?subject=Email Änderung&body=Guten Tag, %0D%0A. Ich würde gerne meine Email von ${initialUser.email} zu  >>Neue Email hier einfügen<< %0D%0A Liebe Grüsse`}>
                Klicke hier um deine Email zu ändern
              </Link>
            </RequestEmail>
          )}
        </PersonalDataEmailWrapper>
      </PersonalDataInputForm>

      {error && <Alert severity="error">{error.message}</Alert>}

      <Button css={buttonStyles} disabled={loading} type="submit">
        Save
      </Button>
    </PersonalDataFormWrapper>
  )
}
