import {zodResolver} from '@hookform/resolvers/zod'
import {Checkbox, FormControlLabel, css, styled} from '@mui/material'
import {BuilderLoginFormProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {Controller, useForm} from 'react-hook-form'
import {z} from 'zod'

export const LoginFormWrapper = styled('div')`
  display: grid;
  width: 100%;
  max-width: 600px;
  justify-self: center;
  gap: ${({theme}) => theme.spacing(2)};
`

export const LoginFormForm = styled('form')`
  display: grid;
  gap: ${({theme}) => theme.spacing(1)};
`

const buttonStyles = css`
  justify-self: flex-end;
`

const withEmailFormSchema = z.object({
  email: z.string().email().nonempty(),
  requirePassword: z.literal(false),
  password: z.string().optional()
})

const withCredentialsFormSchema = z.object({
  email: z.string().email().nonempty(),
  requirePassword: z.literal(true),
  password: z.string().nonempty()
})

const loginFormSchema = z.union([withEmailFormSchema, withCredentialsFormSchema])

export function LoginForm({
  loginWithCredentials,
  onSubmitLoginWithCredentials,
  loginWithEmail,
  onSubmitLoginWithEmail,
  className
}: BuilderLoginFormProps) {
  const {
    elements: {Alert, Button, TextField}
  } = useWebsiteBuilder()

  type FormInput = z.infer<typeof loginFormSchema>
  const {handleSubmit, control, watch, setValue} = useForm<FormInput>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: '',
      password: '',
      requirePassword: false
    },
    mode: 'onTouched',
    reValidateMode: 'onChange'
  })

  const onSubmit = handleSubmit(({email, requirePassword, password}) => {
    if (requirePassword) {
      return onSubmitLoginWithCredentials(email, password)
    }

    return onSubmitLoginWithEmail(email)
  })

  const loginWithPassword = watch('requirePassword')
  const loginLinkSent =
    !loginWithPassword && loginWithEmail.data?.sendWebsiteLogin === watch('email')
  const error =
    (!loginWithPassword && loginWithEmail.error) ||
    (loginWithPassword && loginWithCredentials.error)
  const loading =
    (!loginWithPassword && loginWithEmail.loading) ||
    (loginWithPassword && loginWithCredentials.loading)

  return (
    <LoginFormWrapper className={className}>
      <FormControlLabel
        control={
          <Checkbox
            checked={loginWithPassword}
            onChange={event => setValue('requirePassword', event.target.checked)}
          />
        }
        label="Login mit Passwort"
      />

      <LoginFormForm onSubmit={onSubmit}>
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

        {watch('requirePassword') && (
          <Controller
            name={'password'}
            control={control}
            render={({field, fieldState: {error}}) => (
              <TextField
                {...field}
                type={'password'}
                fullWidth
                label={'Passwort'}
                error={!!error}
                helperText={error?.message}
              />
            )}
          />
        )}

        {error && <Alert severity="error">{error.message}</Alert>}

        {loginLinkSent && (
          <Alert severity="success">
            Falls ein Account unter der Email &quot;{loginWithEmail.data?.sendWebsiteLogin}&quot;
            besteht, sollte bald ein Login-Link in deinem Email Postfach sein.
          </Alert>
        )}

        <Button
          css={buttonStyles}
          disabled={loading || loginLinkSent}
          type="submit"
          onClick={onSubmit}>
          {!loginWithPassword && (
            <>{loginLinkSent ? 'Login-Link versendet' : 'Login-Link anfordern'}</>
          )}

          {loginWithPassword && 'Login'}
        </Button>
      </LoginFormForm>
    </LoginFormWrapper>
  )
}
