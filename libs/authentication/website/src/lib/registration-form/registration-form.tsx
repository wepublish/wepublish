import {zodResolver} from '@hookform/resolvers/zod'
import {css, styled} from '@mui/material'
import {RegisterMutationVariables} from '@wepublish/website/api'
import {BuilderRegistrationFormProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {useEffect} from 'react'
import {Controller, useForm} from 'react-hook-form'
import {OptionalKeysOf} from 'type-fest'
import {z} from 'zod'
import {UserForm} from './user-form'
import {ApolloErrorAlert} from '@wepublish/errors/website'

export const RegistrationFormWrapper = styled('form')`
  display: grid;
  gap: ${({theme}) => theme.spacing(3)};
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

export const requiredRegisterSchema = z.object({
  name: z.string().nonempty(),
  email: z.string().email().nonempty(),
  challengeAnswer: z.object({
    challengeSolution: z.string().nonempty(),
    challengeID: z.string().nonempty()
  })
})

export const defaultRegisterSchema = z.object({
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
  schema = defaultRegisterSchema,
  onRegister
}: BuilderRegistrationFormProps<T>) {
  const fieldsToDisplay = fields.reduce(
    (obj, field) => ({...obj, [field]: true}),
    {} as Record<OptionalKeysOf<RegisterMutationVariables>, true>
  )

  const validationSchema = requiredRegisterSchema.merge(schema.pick(fieldsToDisplay))

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
      <UserForm control={control} fields={fields} />

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

      {challenge.error && <ApolloErrorAlert error={challenge.error} severity="error" />}
      {register.error && <ApolloErrorAlert error={register.error} severity="error" />}

      <Button css={buttonStyles} disabled={register.loading || challenge.loading} type="submit">
        Registrieren
      </Button>
    </RegistrationFormWrapper>
  )
}
