import {zodResolver} from '@hookform/resolvers/zod'
import {IconButton, InputAdornment, Theme, css, styled, useTheme} from '@mui/material'
import {
  BuilderPersonalDataFormProps,
  PersonalDataFormFields,
  useWebsiteBuilder
} from '@wepublish/website/builder'
import {useReducer} from 'react'
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
  grid-template-columns: 1fr 1fr;
`

export const PersonalDataAddressWrapper = styled('div')`
  grid-column-start: 1;
  grid-column-end: 3;
  display: grid;
  gap: ${({theme}) => theme.spacing(3)};
  grid-template-columns: repeat(1fr, 4);
`

const postCodeStyles = css`
  grid-column-start: 1;
  grid-column-end: 2;
`

const cityStyles = css`
  grid-column-start: 2;
  grid-column-end: 4;
`

const PasswordWrapper = styled('div')`
  position: relative;
  margin-top: 12px;
  grid-column-start: 1;
  grid-column-end: 3;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({theme}) => theme.spacing(3)};
`

const passwordNoteStyles = (theme: Theme) => css`
  font-size: ${theme.typography.caption.fontSize};
  position: absolute;
  top: -24px;
`

const emailStyles = (theme: Theme) => css`
  grid-column-start: 1;
  grid-column-end: 3;
  ${theme.breakpoints.up('sm')} {
    grid-column-start: 1;
    grid-column-end: 2;
  }
`

const flairStyles = css`
  grid-column-start: 1;
  grid-column-end: 3;
`

const addressStyles = css`
  grid-column-start: 1;
  grid-column-end: 4;
`

const buttonStyles = css`
  justify-self: flex-end;
`

const requestEmailStyles = (theme: Theme) => css`
  grid-column-start: 1;
  grid-column-end: 3;
  ${theme.breakpoints.up('sm')} {
    grid-column-start: 2;
    grid-column-end: 3;
  }
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

export function PersonalDataForm<T extends OptionalKeysOf<PersonalDataFormFields>>({
  fields = [
    'firstName',
    'name',
    'flair',
    'address',
    'password',
    'passwordRepeated',
    'preferredName',
    'image'
  ] as T[],
  update,
  className,
  initialUser,
  schema = defaultSchema,
  onUpdate,
  onImageUpload,
  mediaEmail
}: BuilderPersonalDataFormProps<T>) {
  const theme = useTheme()
  const [showPassword, togglePassword] = useReducer(state => !state, false)
  const [showRepeatPassword, toggleRepeatPassword] = useReducer(state => !state, false)

  const fieldsToDisplay = fields.reduce(
    (obj, field) => ({...obj, [field]: true}),
    {} as Record<OptionalKeysOf<PersonalDataFormFields>, true>
  )

  const validationSchema = requiredSchema
    .merge(schema.pick(fieldsToDisplay))
    .refine(data => data.password === data.passwordRepeated, {
      message: "Passwords don't match",
      path: ['passwordRepeated']
    })

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
      uploadImageInput: initialUser.uploadImageInput || {}
    },
    mode: 'onTouched',
    reValidateMode: 'onChange'
  })

  const {
    elements: {TextField, Alert, Button, Paragraph, ImageUpload}
  } = useWebsiteBuilder()

  const onSubmit = handleSubmit(data => onUpdate?.(data))

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
                  image={{url: initialUser.image?.url || null}}
                  onUpload={onImageUpload}
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
              <TextField {...field} label={'Vorname'} error={!!error} helperText={error?.message} />
            )}
          />
        )}
        <Controller
          name={'name'}
          control={control}
          render={({field, fieldState: {error}}) => (
            <TextField {...field} label={'Nachname'} error={!!error} helperText={error?.message} />
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
                css={flairStyles}
                label={'Function/Profession'}
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
                  css={addressStyles}
                  fullWidth
                  label={'Address'}
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
                  css={postCodeStyles}
                  label={'Postleitzahl'}
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
                  css={cityStyles}
                  label={'Stadt'}
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
                  css={addressStyles}
                  fullWidth
                  label={'Land'}
                  error={!!error}
                  helperText={error?.message}
                />
              )}
            />
          </PersonalDataAddressWrapper>
        )}
        {fieldsToDisplay.password && (
          <PasswordWrapper>
            <Controller
              name={'password'}
              control={control}
              render={({field, fieldState: {error}}) => (
                <>
                  <Paragraph css={() => passwordNoteStyles(theme)}>
                    Nur ausfüllen, wenn Sie das Passwort ändern möchten. Ansonsten leer lassen.
                  </Paragraph>
                  <TextField
                    {...field}
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
                  fullWidth
                  label={'Repeat Passwort'}
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
          </PasswordWrapper>
        )}
        <Controller
          name={'email'}
          control={control}
          render={({field, fieldState: {error}}) => (
            <TextField
              {...field}
              css={() => emailStyles(theme)}
              type={'email'}
              fullWidth
              disabled
              label={'Email (not editable)'}
              error={!!error}
              helperText={error?.message}
            />
          )}
        />

        {mediaEmail && (
          <RequestEmail css={() => requestEmailStyles(theme)}>
            <a
              href={`mailto:${mediaEmail}&subject=Email Änderung&body=Guten Tag, %0D%0A. Ich würde gerne meine Email von ${initialUser.email} zu  >>Neue Email hier einfügen<< %0D%0A Liebe Grüsse`}>
              Klicke hier um deine Email zu ändern
            </a>
          </RequestEmail>
        )}
      </PersonalDataInputForm>
      {update.error && <Alert severity="error">{update.error.message}</Alert>}

      <Button css={buttonStyles} disabled={update.loading} type="submit">
        Save
      </Button>
    </PersonalDataFormWrapper>
  )
}
