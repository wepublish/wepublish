import React, {useState, useContext, FormEvent, useEffect} from 'react'
import {LoginTemplate, TextInput, Button, Box, Spacing, InputType, Toast} from '@karma.run/ui'
import {RouteActionType, styled} from '@karma.run/react'
import {useMutation} from '@apollo/react-hooks'

import {useRouteDispatch, matchRoute, useRoute, IndexRoute} from './route'
import {AuthDispatchContext, AuthDispatchActionType} from './authContext'

import gql from 'graphql-tag'
import {LocalStorageKey} from './utility'
import {Logo} from './logo'

const LoginForm = styled('form', () => ({
  display: 'flex',
  flexDirection: 'column',
  margin: 0
}))

const AuthWithCredentialsMutation = gql`
  mutation CreateSession($email: String!, $password: String!) {
    createSession(email: $email, password: $password) {
      user {
        email
      }
      token
    }
  }
`

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const {current} = useRoute()

  const authDispatch = useContext(AuthDispatchContext)
  const routeDispatch = useRouteDispatch()

  const [isErrorToastOpen, setErrorToastOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [authenticate, {loading, error}] = useMutation(AuthWithCredentialsMutation)

  useEffect(() => {
    if (error) {
      setErrorToastOpen(true)
      setErrorMessage(error.message)
    }
  }, [error])

  async function login(e: FormEvent) {
    e.preventDefault()

    const response = await authenticate({variables: {email, password}})

    const {
      token: sessionToken,
      user: {email: responseEmail}
    } = response.data.createSession

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
      <LoginTemplate backgroundChildren={<Background focus />}>
        <LoginForm onSubmit={login}>
          <Box marginBottom={Spacing.Small}>
            <TextInput
              label="Email"
              value={email}
              onChange={event => setEmail(event.target.value)}
            />
          </Box>
          <Box marginBottom={Spacing.Small}>
            <TextInput
              type={InputType.Password}
              label="Password"
              value={password}
              onChange={event => setPassword(event.target.value)}
            />
          </Box>
          <Button color="primary" label="Login" disabled={loading} />
        </LoginForm>
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
  transform: 'translateY(-180px)'
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
