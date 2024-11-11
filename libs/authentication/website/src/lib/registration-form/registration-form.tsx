import {zodResolver} from '@hookform/resolvers/zod'
import {css, styled} from '@mui/material'
import {RegisterMutationVariables} from '@wepublish/website/api'
import {
  BuilderRegistrationFormProps,
  BuilderUserFormFields,
  useWebsiteBuilder
} from '@wepublish/website/builder'
import {useEffect, useMemo} from 'react'
import {Controller, useForm} from 'react-hook-form'
import {z} from 'zod'
import {UserForm} from './user-form'
import {ApiAlert} from '@wepublish/errors/website'
import {userCountryNames} from '@wepublish/user'

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

/**
 * Zod only runs refine once the full schema is valid.
 * This is an issue as a user might be midway through the form and wants to get feedback.
 *
 * Usually this is solved by splitting the schema into multiple and then using z.intersection,
 * but this turns it into a z.ZodIntersection which does not allow to omit or pick. We need this
 * functionality to allow not showing certain fields.
 */
export function zodAlwaysRefine<T extends z.ZodTypeAny>(zodType: T) {
  return z.any().superRefine(async (value, ctx) => {
    const res = await zodType.safeParseAsync(value)

    if (res.success === false)
      for (const issue of res.error.issues) {
        ctx.addIssue(issue)
      }
  }) as unknown as T
}

export const requiredRegisterSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().min(1),
  challengeAnswer: z.object({
    challengeSolution: z.string().min(1),
    challengeID: z.string().min(1)
  })
})

export const defaultRegisterSchema = z.object({
  firstName: z.string().min(1),
  address: z.object({
    streetAddress: z.string().min(1),
    zipCode: z.string().min(1),
    city: z.string().min(1),
    country: z.enum(userCountryNames)
  }),
  password: z.string().min(8),
  passwordRepeated: z.string().min(8),
  birthday: z.coerce.date().max(new Date())
})

export function RegistrationForm<T extends Exclude<BuilderUserFormFields, 'flair'>>({
  challenge,
  fields = ['firstName', 'address', 'password', 'passwordRepeated'] as T[],
  register,
  className,
  schema = defaultRegisterSchema,
  onRegister
}: BuilderRegistrationFormProps<T>) {
  const fieldsToDisplay = fields.reduce(
    (obj, field) => ({...obj, [field]: true}),
    {} as Record<Exclude<BuilderUserFormFields, 'flair'>, true>
  )

  /**
   * Done like this to avoid type errors due to z.ZodObject vs z.ZodEffect<z.ZodObject>.
   * [Fixed with Zod 4](https://github.com/colinhacks/zod/issues/2474)
   */
  const validationSchema = useMemo(() => {
    const result = requiredRegisterSchema.merge(schema.pick(fieldsToDisplay))

    if (fieldsToDisplay.passwordRepeated) {
      return zodAlwaysRefine(result).refine(data => data.password === data.passwordRepeated, {
        message: 'Passwörter stimmen nicht überein.',
        path: ['passwordRepeated']
      })
    }

    return result
  }, [fieldsToDisplay, schema])

  const {handleSubmit, control, setValue} = useForm<RegisterMutationVariables>({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      challengeAnswer: {
        challengeID: '',
        challengeSolution: ''
      }
    },
    mode: 'onTouched',
    reValidateMode: 'onChange'
  })

  const {
    elements: {TextField, Button}
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

      {challenge.error && <ApiAlert error={challenge.error} severity="error" />}
      {register.error && <ApiAlert error={register.error} severity="error" />}

      <Button css={buttonStyles} disabled={register.loading || challenge.loading} type="submit">
        Registrieren
      </Button>
    </RegistrationFormWrapper>
  )
}
