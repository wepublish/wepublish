import React, {useState, useContext, useEffect} from 'react'
import {LoginTemplate, TextInput, PrimaryButton} from '@karma.run/ui'
import {authenticateWithCredentials} from '@wepublish/api'
import {RouteActionType} from '@karma.run/react'

import {useRouteDispatch, matchRoute, useRoute, IndexRoute} from './route'
import {AuthDispatchContext, AuthDispatchActionType, AuthContext} from './authContext'
import {CancelToken} from '@wepublish/api/lib/cjs/client/query'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const {current} = useRoute()

  const {session} = useContext(AuthContext)
  const authDispatch = useContext(AuthDispatchContext)
  const routeDispatch = useRouteDispatch()

  useEffect(() => {
    const refreshToken = localStorage.getItem('refreshToken')

    if (refreshToken) {
      setLoading(true)

      const cancelToken = new CancelToken()

      authenticateWithCredentials('http://localhost:3000', 'dev@wepublish.ch', '123', {
        cancelToken
      })
        .then(({user, refreshToken, accessToken, refreshTokenExpiresIn, accessTokenExpiresIn}) => {
          authDispatch({
            type: AuthDispatchActionType.Login,
            email: user.email,
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
        })
        .catch(err => {
          console.error(err)
        })

      return () => cancelToken.cancel()
    }

    return () => {}
  }, [])

  async function login() {
    setLoading(true)

    try {
      const {refreshToken, accessToken} = await authenticateWithCredentials(
        'http://localhost:3000',
        email,
        password
      )

      localStorage.setItem('refreshToken', refreshToken)
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
