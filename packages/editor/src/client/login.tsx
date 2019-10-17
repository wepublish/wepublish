import React, {useState, useContext} from 'react'
import {LoginTemplate, TextInput, PrimaryButton} from '@karma.run/ui'
import {authenticateWithCredentials} from '@wepublish/api'
import {RouteActionType} from '@karma.run/react'

import {useRouteDispatch, matchRoute, useRoute, IndexRoute} from './route'
import {AuthDispatchContext, AuthDispatchActionType} from './authContext'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const {current} = useRoute()

  const authDispatch = useContext(AuthDispatchContext)
  const routeDispatch = useRouteDispatch()

  async function login() {
    setLoading(true)

    try {
      const {refreshToken, accessToken} = await authenticateWithCredentials(
        'http://localhost:3000',
        email,
        password
      )

      console.log(refreshToken)

      authDispatch({type: AuthDispatchActionType.Login, email, refreshToken, accessToken})

      if (current!.query && current!.query.next) {
        const route = matchRoute(location.origin + current!.query.next)

        if (route) {
          routeDispatch({type: RouteActionType.ReplaceRoute, route})
          return
        }
      }

      routeDispatch({type: RouteActionType.ReplaceRoute, route: IndexRoute.create({})})
    } catch (err) {
      setLoading(false)
    }
  }

  return (
    <LoginTemplate>
      <TextInput label="Email" value={email} onChange={event => setEmail(event.target.value)} />
      <TextInput
        label="Password"
        value={password}
        onChange={event => setPassword(event.target.value)}
      />
      <PrimaryButton label="Login" onClick={login} disabled={loading} />
    </LoginTemplate>
  )
}
