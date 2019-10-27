import React, {useState, useContext, FormEvent} from 'react'
import {LoginTemplate, TextInput, PrimaryButton} from '@karma.run/ui'
import {RouteActionType, styled} from '@karma.run/react'
import {useMutation} from '@apollo/react-hooks'

import {useRouteDispatch, matchRoute, useRoute, IndexRoute} from './route'
import {AuthDispatchContext, AuthDispatchActionType} from './authContext'

import gql from 'graphql-tag'

export const LoginForm = styled('form', () => ({
  display: 'flex',
  flexDirection: 'column'
}))

const AuthWithCredentialsQuery = gql`
  mutation authenticateWithCredentials($email: String!, $password: String!) {
    authenticateWithCredentials(email: $email, password: $password) {
      user {
        email
      }
      refreshToken
      accessToken
      refreshTokenExpiresIn
      accessTokenExpiresIn
    }
  }
`

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const {current} = useRoute()

  const authDispatch = useContext(AuthDispatchContext)
  const routeDispatch = useRouteDispatch()

  const [authenticate, {loading, error}] = useMutation(AuthWithCredentialsQuery)

  async function login(e: FormEvent) {
    e.preventDefault()

    const response = await authenticate({variables: {email, password}})

    const {
      refreshToken,
      accessToken,
      user: {email: responseEmail}
    } = response.data.authenticateWithCredentials

    authDispatch({
      type: AuthDispatchActionType.Login,
      email: responseEmail,
      refreshToken,
      accessToken
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
        <TextInput label="Email" value={email} onChange={event => setEmail(event.target.value)} />
        <TextInput
          label="Password"
          value={password}
          onChange={event => setPassword(event.target.value)}
        />
        <PrimaryButton label="Login" disabled={loading} />
        {error && error.message}
      </LoginForm>
    </LoginTemplate>
  )
}
