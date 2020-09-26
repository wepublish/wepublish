import React, {useState, useContext, FormEvent, useEffect} from 'react'
import {LoginTemplate, TextInput, Button, Spacing, Toast, Link, Box} from '@karma.run/ui'
import {RouteActionType, styled} from '@karma.run/react'

import {useRouteDispatch, matchRoute, useRoute, IndexRoute, LoginRoute} from './route'
import {AuthDispatchContext, AuthDispatchActionType} from './authContext'

import {LocalStorageKey} from './utility'
import {Logo} from './logo'
import {
  useCreateSessionWithOAuth2CodeMutation,
  useCreateSessionMutation,
  useGetAuthProvidersQuery
} from './api'

const LoginForm = styled('form', () => ({
  display: 'flex',
  flexDirection: 'column',
  margin: 0
}))

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const {current} = useRoute()

  const authDispatch = useContext(AuthDispatchContext)
  const routeDispatch = useRouteDispatch()

  const [isErrorToastOpen, setErrorToastOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [authenticate, {loading, error}] = useCreateSessionMutation()

  const [
    authenticateWithOAuth2Code,
    {loading: loadingOAuth2, error: errorOAuth2}
  ] = useCreateSessionWithOAuth2CodeMutation()

  const {data: providerData} = useGetAuthProvidersQuery({
    variables: {
      redirectUri: `${window.location.protocol}//${window.location.host}${window.location.pathname}`
    }
  })

  useEffect(() => {
    if (current !== null && current.params !== null && current.query && current.query.code) {
      // TODO: fix this
      // eslint-disable-next-line
      // @ts-ignore
      const provider = current.params.provider
      const {code} = current!.query
      authenticateWithOAuth2Code({
        variables: {
          redirectUri: `${window.location.protocol}//${window.location.host}${window.location.pathname}`,
          name: provider,
          code
        }
      })
        .then((response: any) => {
          const {
            token: sessionToken,
            user: {email: responseEmail}
          } = response.data.createSessionWithOAuth2Code

          authenticateUser(sessionToken, responseEmail)
        })
        .catch(() => {
          routeDispatch({type: RouteActionType.ReplaceRoute, route: LoginRoute.create({})})
        })
    }
  }, [current])

  useEffect(() => {
    if (error) {
      setErrorToastOpen(true)
      setErrorMessage(error.message)
    }
    if (errorOAuth2) {
      setErrorToastOpen(true)
      setErrorMessage(errorOAuth2.message)
    }
  }, [error, errorOAuth2])

  async function login(e: FormEvent) {
    e.preventDefault()

    const response = await authenticate({variables: {email, password}})

    if (!response.data?.createSession) return

    const {
      token: sessionToken,
      user: {email: responseEmail}
    } = response.data.createSession

    authenticateUser(sessionToken, responseEmail)
  }

  function authenticateUser(sessionToken: string, responseEmail: string) {
    localStorage.setItem(LocalStorageKey.SessionToken, sessionToken)

    authDispatch({
      type: AuthDispatchActionType.Login,
      email: responseEmail,
      sessionToken
    })

    if (current!.query && current!.query.next) {
      const route = matchRoute(location.origin + current!.query.next)
      if (route) {
        routeDispatch({type: RouteActionType.ReplaceRoute, route})
        return
      }
    }
    routeDispatch({type: RouteActionType.ReplaceRoute, route: IndexRoute.create({})})
  }

  return (
    <>
      <LoginTemplate backgroundChildren={<Background />}>
        {!loadingOAuth2 && (
          <>
            <LoginForm onSubmit={login}>
              <TextInput
                label="Email"
                value={email}
                autoComplete="username"
                onChange={event => setEmail(event.target.value)}
                marginBottom={Spacing.Small}
              />
              <TextInput
                type="password"
                label="Password"
                value={password}
                autoComplete="current-password"
                onChange={event => setPassword(event.target.value)}
                marginBottom={Spacing.Small}
              />
              <Button color="primary" label="Login" disabled={loading} />
            </LoginForm>
            {!!providerData?.authProviders?.length && (
              <>
                <Box
                  display="flex"
                  flexDirection="column"
                  marginTop={Spacing.Small}
                  alignItems="center">
                  <p>Or Login with:</p>
                  {providerData.authProviders.map(
                    (provider: {url: string; name: string}, index: number) => {
                      return (
                        <Link href={provider.url} key={index}>
                          <Box margin={Spacing.Tiny}>
                            <Button label={provider.name} variant="outlined" color="primary" />
                          </Box>
                        </Link>
                      )
                    }
                  )}
                </Box>
              </>
            )}
          </>
        )}
        {loadingOAuth2 && (
          <div>
            <p>Authenticating against OAuth2</p>
          </div>
        )}
      </LoginTemplate>

      <Toast
        type="error"
        open={isErrorToastOpen}
        autoHideDuration={5000}
        onClose={() => setErrorToastOpen(false)}>
        {errorMessage}
      </Toast>
    </>
  )
}

const BackgroundWrapper = styled('div', () => ({
  position: 'relative',
  width: 340,
  height: 40,
  transform: 'translateY(-0px)'
}))

const RedCircle = styled('div', () => ({
  position: 'absolute',
  width: 340,
  height: 340,
  borderRadius: '100%',
  transform: 'translateY(-80px)',
  background: 'linear-gradient(-90deg, #D95560 0%, #FF6370 100%)'
}))

const OrangeCircle = styled('div', () => ({
  position: 'absolute',
  left: '50%',
  width: 260,
  height: 260,
  borderRadius: '100%',
  transform: 'translateX(-50%) translateX(-180px) translateY(-40px)',
  background: 'linear-gradient(230deg, #F08C1F 0%, #FFA463 100%)'
}))

const GreenCircle = styled('div', () => ({
  position: 'absolute',
  left: '50%',
  width: 260,
  height: 260,
  borderRadius: '100%',
  transform: 'translateX(-50%) translateX(180px) translateY(-40px)',
  background: 'linear-gradient(10deg, #29805A 0%, #34D690 100%)'
}))

const BlueCircle = styled('div', () => ({
  position: 'absolute',
  left: '50%',
  width: 260,
  height: 260,
  borderRadius: '100%',
  transform: 'translateX(-50%) translateY(-140px)',
  background: 'linear-gradient(-40deg, #03738C 0%, #04C4D9 100%)'
}))

const LogoWrapper = styled('div', () => ({
  position: 'absolute',
  left: '50%',
  transform: 'translateX(-50%)',
  width: 230
}))

function Background() {
  return (
    <BackgroundWrapper>
      <OrangeCircle />
      <GreenCircle />
      <BlueCircle />
      <RedCircle />
      <LogoWrapper>
        <Logo />
      </LogoWrapper>
    </BackgroundWrapper>
  )
}
