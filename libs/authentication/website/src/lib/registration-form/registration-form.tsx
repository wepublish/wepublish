import {zodResolver} from '@hookform/resolvers/zod'
import {IconButton, InputAdornment, css, styled} from '@mui/material'
import {RegisterMutationVariables} from '@wepublish/website/api'
import {BuilderRegistrationFormProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {useEffect, useReducer} from 'react'
import {Controller, useForm} from 'react-hook-form'
import {MdVisibility, MdVisibilityOff} from 'react-icons/md'
import {OptionalKeysOf} from 'type-fest'
import {z} from 'zod'

export const RegistrationFormWrapper = styled('form')`
  display: grid;
  gap: ${({theme}) => theme.spacing(3)};
`

export const RegistrationInputForm = styled('div')`
  display: grid;
  gap: ${({theme}) => theme.spacing(3)};
  grid-template-columns: 1fr 1fr;
`

export const RegistrationAddressWrapper = styled('div')`
  grid-column-start: 1;
  grid-column-end: 3;
  display: grid;
  gap: ${({theme}) => theme.spacing(3)};
  grid-template-columns: repeat(1fr, 3);
`

const addressStyles = css`
  grid-column-start: 1;
  grid-column-end: 4;
`

export const RegistrationChallengeWrapper = styled('div')`
  display: grid;
  grid-template-columns: minmax(max-content, 200px) 200px;
  align-items: center;
  gap: ${({theme}) => theme.spacing(3)};
  justify-content: flex-start;
`

export const RegistrationChallenge = styled('div')`
  height: 100%;
  display: grid;

  svg {
    height: 100%;
  }
`

const buttonStyles = css`
  justify-self: flex-end;
`

const requiredSchema = z.object({
  name: z.string().nonempty(),
  email: z.string().email().nonempty(),
  challengeAnswer: z.object({
    challengeSolution: z.string().nonempty(),
    challengeID: z.string().nonempty()
  })
})

const defaultSchema = z.object({
  preferredName: z.string().optional(),
  firstName: z.string().nonempty(),
  address: z.object({
    streetAddress: z.string().nonempty(),
    zipCode: z.string().nonempty(),
    city: z.string().nonempty(),
    country: z.string().nonempty()
  }),
  password: z.string().min(8)
})

export function RegistrationForm<T extends OptionalKeysOf<RegisterMutationVariables>>({
  challenge,
  fields = ['firstName', 'address', 'password'] as T[],
  register,
  className,
  schema = defaultSchema,
  onRegister
}: BuilderRegistrationFormProps<T>) {
  const [showPassword, togglePassword] = useReducer(state => !state, false)

  const fieldsToDisplay = fields.reduce(
    (obj, field) => ({...obj, [field]: true}),
    {} as Record<OptionalKeysOf<RegisterMutationVariables>, true>
  )

  const validationSchema = requiredSchema.merge(schema.pick(fieldsToDisplay))

  const {handleSubmit, control, setValue} = useForm<RegisterMutationVariables>({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      challengeAnswer: {
        challengeID: '',
        challengeSolution: ''
      },
      address: {
        city: '',
        country: '',
        streetAddress: '',
        zipCode: ''
      },
      email: '',
      name: '',
      firstName: '',
      password: '',
      preferredName: ''
    },
    mode: 'onTouched',
    reValidateMode: 'onChange'
  })

  const {
    elements: {TextField, Alert, Button}
  } = useWebsiteBuilder()

  const onSubmit = handleSubmit(data => onRegister?.(data))

  useEffect(() => {
    setValue('challengeAnswer.challengeID', challenge.data?.challenge.challengeID ?? '')
  }, [challenge, setValue])

  return (
    <RegistrationFormWrapper className={className} onSubmit={onSubmit}>
      <RegistrationInputForm>
        {fieldsToDisplay.firstName && (
          <Controller
            name={'firstName'}
            control={control}
            render={({field, fieldState: {error}}) => (
              <TextField {...field} label={'Vorname'} error={!!error} helperText={error?.message} />
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
                label={'Bevorzugter Name'}
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
            <TextField {...field} label={'Nachname'} error={!!error} helperText={error?.message} />
          )}
        />

        <Controller
          name={'email'}
          control={control}
          render={({field, fieldState: {error}}) => (
            <TextField
              {...field}
              type={'email'}
              fullWidth
              label={'Email'}
              error={!!error}
              helperText={error?.message}
            />
          )}
        />

        {fieldsToDisplay.password && (
          <Controller
            name={'password'}
            control={control}
            render={({field, fieldState: {error}}) => (
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
            )}
          />
        )}

        {fieldsToDisplay.address && (
          <RegistrationAddressWrapper>
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
                  fullWidth
                  label={'Land'}
                  error={!!error}
                  helperText={error?.message}
                />
              )}
            />
          </RegistrationAddressWrapper>
        )}
      </RegistrationInputForm>

      {challenge.data && (
        <RegistrationChallengeWrapper>
          <RegistrationChallenge
            dangerouslySetInnerHTML={{
              __html:
                challenge.data.challenge.challenge
                  ?.replace('#ffffff', 'transparent')
                  .replace('width="200"', '')
                  .replace('height="200"', '') ?? ''
            }}
          />

          <Controller
            name={'challengeAnswer.challengeSolution'}
            control={control}
            render={({field, fieldState: {error}}) => (
              <TextField {...field} label={'Captcha'} error={!!error} helperText={error?.message} />
            )}
          />
        </RegistrationChallengeWrapper>
      )}

      {challenge.error && <Alert severity="error">{challenge.error.message}</Alert>}
      {register.error && <Alert severity="error">{register.error.message}</Alert>}

      <Button css={buttonStyles} disabled={register.loading || challenge.loading} type="submit">
        Registrieren
      </Button>
    </RegistrationFormWrapper>
  )
}
