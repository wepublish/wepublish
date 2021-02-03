import React, {useState, useContext, FormEvent, useEffect} from 'react'
import {RouteActionType} from '@karma.run/react'

import {useRouteDispatch, matchRoute, useRoute, PageRoute} from './routeContext'
import {AuthDispatchContext, AuthDispatchActionType} from '../authContext'

import {LocalStorageKey} from '../utility'
import {gql, useMutation} from '@apollo/client'

const AuthQuery = gql`
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

  const [authenticate, {loading, error}] = useMutation(AuthQuery)

  useEffect(() => {
    if (error) {
      alert(error)
    }
  }, [loading, error])

  async function login(e: FormEvent) {
    debugger
    e.preventDefault()

    const response = await authenticate({variables: {email, password}})

    if (!response.data?.createSession) return

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
    routeDispatch({type: RouteActionType.ReplaceRoute, route: PageRoute.create({})})
  }

  return (
    <form style={{marginTop: '40px'}} onSubmit={login}>
      <label>
        Email:
        <input type="email" value={email} onChange={event => setEmail(event.target.value)} />
      </label>
      <label>
        Password:
        <input
          type="password"
          value={password}
          onChange={event => setPassword(event.target.value)}
        />
      </label>
      <input type="submit" value="Login" />
    </form>
  )
}
