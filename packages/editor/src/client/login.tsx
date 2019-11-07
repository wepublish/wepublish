import React, {useState, useContext, FormEvent} from 'react'
import {LoginTemplate, TextInput, Button, Box, Spacing} from '@karma.run/ui'
import {RouteActionType, styled} from '@karma.run/react'
import {useMutation} from '@apollo/react-hooks'

import {useRouteDispatch, matchRoute, useRoute, IndexRoute} from './route'
import {AuthDispatchContext, AuthDispatchActionType} from './authContext'

import gql from 'graphql-tag'
import {LocalStorageKey} from './utility'

export const LoginForm = styled('form', () => ({
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

  const [authenticate, {loading, error}] = useMutation(AuthWithCredentialsMutation)

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
    <LoginTemplate>
      <LoginForm onSubmit={login}>
        <Box marginBottom={Spacing.Small}>
          <TextInput label="Email" value={email} onChange={event => setEmail(event.target.value)} />
        </Box>
        <Box marginBottom={Spacing.Small}>
          <TextInput
            label="Password"
            value={password}
            onChange={event => setPassword(event.target.value)}
          />
        </Box>
        <Button label="Login" disabled={loading} />
        {error && error.message}
      </LoginForm>
    </LoginTemplate>
  )
}
