import React, {useState, useContext} from 'react'
import {LoginTemplate, TextInput, PrimaryButton} from '@karma.run/ui'
import {RouteActionType} from '@karma.run/react'

import {useRouteDispatch, matchRoute, useRoute, IndexRoute} from './route'
import {AuthDispatchContext, AuthDispatchActionType} from './authContext'

export function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const {current} = useRoute()

  const authDispatch = useContext(AuthDispatchContext)
  const routeDispatch = useRouteDispatch()

  function login() {
    setLoading(true)

    setTimeout(() => {
      authDispatch({type: AuthDispatchActionType.Login, username, token: '123'})

      if (current!.query && current!.query.next) {
        const route = matchRoute(location.origin + current!.query.next)

        if (route) {
          routeDispatch({type: RouteActionType.ReplaceRoute, route})
          return
        }
      }

      routeDispatch({type: RouteActionType.ReplaceRoute, route: IndexRoute.create({})})
    }, 1000)
  }

  return (
    <LoginTemplate>
      <TextInput
        label="Username"
        value={username}
        onChange={event => setUsername(event.target.value)}
      />
      <TextInput
        label="Password"
        value={password}
        onChange={event => setPassword(event.target.value)}
      />
      <PrimaryButton label="Login" onClick={login} disabled={loading} />
    </LoginTemplate>
  )
}
