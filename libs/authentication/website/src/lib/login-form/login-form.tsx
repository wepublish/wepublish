import {Checkbox, FormControlLabel, css, styled} from '@mui/material'
import {BuilderLoginFormProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {useState} from 'react'
import {Controller, useForm} from 'react-hook-form'

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

export function LoginForm({
  subscriptionPath,
  loginWithCredentials,
  onSubmitLoginWithCredentials,
  loginWithEmail,
  onSubmitLoginWithEmail,
  className
}: BuilderLoginFormProps) {
  const {
    elements: {Alert, Button, H3, Paragraph, Link, TextField}
  } = useWebsiteBuilder()

  const [loginWithPassword, setLoginWithPassword] = useState(false)

  const {handleSubmit, control, watch} = useForm({
    defaultValues: {
      email: '',
      password: ''
    },
    mode: 'onTouched',
    reValidateMode: 'onChange'
  })

  const onSubmit = handleSubmit(({email, password}) => {
    if (loginWithPassword) {
      return onSubmitLoginWithCredentials(email, password)
    }

    return onSubmitLoginWithEmail(email)
  })

  const loginLinkSent =
    !loginWithPassword && loginWithEmail.data?.sendWebsiteLogin === watch('email')
  const error = loginWithEmail.error ?? loginWithCredentials.error
  const loading = loginWithEmail.loading || loginWithCredentials.loading

  return (
    <LoginFormWrapper className={className}>
      <H3 component="h1">Login für Abonnent*innen</H3>

      <Paragraph>
        (Falls du ein Abo lösen willst, <Link href={subscriptionPath}>klicke hier.</Link>)
      </Paragraph>

      <FormControlLabel
        control={
          <Checkbox
            checked={loginWithPassword}
            onChange={event => setLoginWithPassword(event.target.checked)}
          />
        }
        label="Login mit Passwort"
      />

      <LoginFormForm
        onSubmit={e => {
          e.preventDefault()
          onSubmit()
        }}>
        <Controller
          name={'email'}
          control={control}
          rules={{required: true}}
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

        {loginWithPassword && (
          <Controller
            name={'password'}
            control={control}
            rules={{required: true, minLength: 3}}
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
          type="button"
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
