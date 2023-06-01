import {Alert, TextField, styled} from '@mui/material'
import {AuthTokenStorageKey, useUser, useWebsiteBuilder} from '@wepublish/website'
import {
  LoginWithJwtDocument,
  UserSession,
  getV1ApiClient,
  useLoginMutation
} from '@wepublish/website/api'
import {setCookie} from 'cookies-next'
import {GetServerSideProps} from 'next'
import {useRouter} from 'next/router'
import {useEffect} from 'react'
import {Controller, useForm} from 'react-hook-form'
import getConfig from 'next/config'

const LoginWrapper = styled('div')`
  display: grid;
  width: 100%;
  max-width: 600px;
  justify-self: center;
  gap: ${({theme}) => theme.spacing(2)};
`

const LoginForm = styled('form')`
  display: grid;
  gap: ${({theme}) => theme.spacing(1)};
`

export default function Login() {
  const {hasUser} = useUser()
  const router = useRouter()
  const [login, {loading, data}] = useLoginMutation()

  const {
    elements: {Button, H3, Paragraph, Link}
  } = useWebsiteBuilder()

  const {handleSubmit, control, watch} = useForm({
    defaultValues: {
      email: ''
    },
    mode: 'onSubmit'
  })

  useEffect(() => {
    if (hasUser) {
      router.push('/')
    }
  }, [router, hasUser])

  const onSubmit = handleSubmit(({email}) => {
    return login({
      variables: {
        email
      }
    })
  })

  const loginLinkSent = data?.sendWebsiteLogin === watch('email')

  return (
    <LoginWrapper>
      <H3 component="h1">Login für Abonnent*innen</H3>

      <Paragraph>
        (Falls du ein Abo lösen willst, <Link href="/">klicke hier.</Link>)
      </Paragraph>

      <LoginForm
        onSubmit={e => {
          e.preventDefault()
          onSubmit()
        }}>
        <Controller
          name={'email'}
          control={control}
          rules={{required: true}}
          render={({field: {onChange, value}, fieldState: {error}}) => (
            <TextField
              type={'email'}
              fullWidth
              onChange={onChange}
              value={value}
              label={'Email'}
              error={!!error}
              helperText={error?.message}
            />
          )}
        />

        {loginLinkSent && (
          <Alert severity="success">
            Falls ein Account unter der Email &quot;{data.sendWebsiteLogin}&quot; besteht, sollte
            bald ein Login Link in deinem Email Postfach sein.
          </Alert>
        )}

        <Button disabled={loading || loginLinkSent} type="button" onClick={onSubmit}>
          {loginLinkSent ? <>Login link versendet</> : <>Login link zusenden</>}
        </Button>
      </LoginForm>
    </LoginWrapper>
  )
}

export const getServerSideProps: GetServerSideProps = async ctx => {
  const {publicRuntimeConfig} = getConfig()
  const client = getV1ApiClient(publicRuntimeConfig.env.API_URL!, [])

  if (ctx.query.jwt) {
    const data = await client.mutate({
      mutation: LoginWithJwtDocument,
      variables: {
        jwt: ctx.query.jwt
      }
    })

    setCookie(AuthTokenStorageKey, JSON.stringify(data.data.createSessionWithJWT as UserSession), {
      req: ctx.req,
      res: ctx.res,
      expires: new Date(data.data.createSessionWithJWT.expiresAt)
    })

    return {
      redirect: {
        destination: '/',
        permanent: false
      }
    }
  }

  return {
    props: {}
  }
}
