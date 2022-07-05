import React, {useState, useContext, FormEvent, useEffect} from 'react'
import {RouteActionType, RouteInstance} from '@wepublish/karma.run-react'

import {LoginTemplate} from './atoms/loginTemplate'

import {
  useRouteDispatch,
  matchRoute,
  useRoute,
  IndexRoute,
  LoginRoute,
  IconButtonLink
} from './route'
import {AuthDispatchContext, AuthDispatchActionType} from './authContext'

import {LocalStorageKey} from './utility'
import {Logo} from './logo'
import {
  useCreateSessionWithOAuth2CodeMutation,
  useCreateSessionWithJwtMutation,
  useCreateSessionMutation,
  useGetAuthProvidersQuery,
  FullUserRoleFragment
} from './api'

import {useTranslation} from 'react-i18next'
import {Button, Form, Divider, toaster, Message} from 'rsuite'
import GoogleIcon from '@rsuite/icons/legacy/Google'
import FacebookIcon from '@rsuite/icons/legacy/Facebook'
import TwitterIcon from '@rsuite/icons/legacy/Twitter'
import SpaceShuttleIcon from '@rsuite/icons/legacy/SpaceShuttle'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const {current} = useRoute()

  const authDispatch = useContext(AuthDispatchContext)
  const routeDispatch = useRouteDispatch()

  const [authenticate, {loading, error: errorLogin}] = useCreateSessionMutation()

  const [
    authenticateWithOAuth2Code,
    {loading: loadingOAuth2, error: errorOAuth2}
  ] = useCreateSessionWithOAuth2CodeMutation()

  const [
    authenticateWithJWT,
    {loading: loadingJWT, error: errorJWT}
  ] = useCreateSessionWithJwtMutation()

  const {data: providerData} = useGetAuthProvidersQuery({
    variables: {
      redirectUri: `${window.location.protocol}//${window.location.host}${window.location.pathname}/oauth`
    }
  })

  const {t} = useTranslation()

  useEffect(() => {
    if (current !== null && current.path === '/login/jwt' && current.query && current.query.jwt) {
      authenticateWithJWT({
        variables: {
          jwt: current.query.jwt
        }
      })
        .then((response: any) => {
          const {
            token: sessionToken,
            user: {email: responseEmail, roles}
          } = response.data.createSessionWithJWT

          authenticateUser(sessionToken, responseEmail, roles)
        })
        .catch(error => {
          console.warn('auth error', error)
          routeDispatch({type: RouteActionType.ReplaceRoute, route: LoginRoute.create({})})
        })
    } else if (current !== null && current.params !== null && current.query && current.query.code) {
      // TODO: fix this
      const provider = (current as RouteInstance).params.provider
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
            user: {email: responseEmail, roles}
          } = response.data.createSessionWithOAuth2Code

          authenticateUser(sessionToken, responseEmail, roles)
        })
        .catch(() => {
          routeDispatch({type: RouteActionType.ReplaceRoute, route: LoginRoute.create({})})
        })
    }
  }, [current])

  useEffect(() => {
    const error = errorLogin?.message ?? errorOAuth2?.message ?? errorJWT?.message
    if (error)
      toaster.push(
        <Message type="error" showIcon closable duration={0}>
          {error}
        </Message>
      )
  }, [errorLogin, errorOAuth2, errorJWT])

  async function login(e: FormEvent) {
    e.preventDefault()

    const response = await authenticate({variables: {email, password}})

    if (!response.data?.createSession) return

    const {
      token: sessionToken,
      user: {email: responseEmail, roles}
    } = response.data.createSession

    authenticateUser(sessionToken, responseEmail, roles)
  }

  function authenticateUser(
    sessionToken: string,
    responseEmail: string,
    userRoles: FullUserRoleFragment[]
  ) {
    const permissions = userRoles.reduce((permissions, userRole) => {
      return [...permissions, ...userRole.permissions.map(permission => permission.id)]
    }, [] as string[])

    if (!permissions.includes('CAN_LOGIN_EDITOR')) {
      toaster.push(
        <Message type="error" showIcon closable duration={0}>
          {t('login.unauthorized')}
        </Message>
      )
      return
    }

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

  function getAuthLogo(name: string): React.ReactElement {
    switch (name) {
      case 'google':
        return <GoogleIcon />
      case 'facebook':
        return <FacebookIcon />
      case 'twitter':
        return <TwitterIcon />
      default:
        return <SpaceShuttleIcon />
    }
  }

  return (
    <LoginTemplate backgroundChildren={<Background />}>
      {!loadingOAuth2 && (
        <>
          <Form
            fluid
            style={{
              display: 'flex',
              flexDirection: 'column',
              margin: 0
            }}>
            <Form.Group>
              <Form.ControlLabel>{t('login.email')}</Form.ControlLabel>
              <Form.Control
                name="email"
                className={'username'}
                value={email}
                autoComplete={'username'}
                onChange={(email: string) => setEmail(email)}
              />
            </Form.Group>
            <Form.Group>
              <Form.ControlLabel>{t('login.password')}</Form.ControlLabel>
              <Form.Control
                name="password"
                className={'password'}
                type="password"
                value={password}
                autoComplete={'currentPassword'}
                onChange={(password: string) => setPassword(password)}
              />
            </Form.Group>
            <Button appearance="primary" type="submit" disabled={loading} onClick={login}>
              {t('login.login')}
            </Button>
          </Form>
          {!!providerData?.authProviders?.length && (
            <>
              <Divider />
              {providerData.authProviders.map(
                (provider: {url: string; name: string}, index: number) => (
                  <IconButtonLink
                    style={{marginBottom: 10}}
                    key={index}
                    appearance="subtle"
                    href={provider.url}
                    icon={getAuthLogo(provider.name)}>
                    {provider.name}
                  </IconButtonLink>
                )
              )}
            </>
          )}
        </>
      )}
      {loadingOAuth2 && (
        <div>
          <p>{t('login.OAuth2')}</p>
        </div>
      )}
      {loadingJWT && (
        <div>
          <p>{t('login.jwt')}</p>
        </div>
      )}
    </LoginTemplate>
  )
}

function Background() {
  return (
    <div
      style={{
        position: 'relative',
        width: 340,
        height: 40,
        transform: 'translateY(-0px)'
      }}>
      <div
        style={{
          position: 'absolute',
          left: '50%',
          width: 260,
          height: 260,
          borderRadius: '100%',
          transform: 'translateX(-50%) translateX(-180px) translateY(-40px)',
          background: 'linear-gradient(230deg, #F08C1F 0%, #FFA463 100%)'
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: '50%',
          width: 260,
          height: 260,
          borderRadius: '100%',
          transform: 'translateX(-50%) translateX(180px) translateY(-40px)',
          background: 'linear-gradient(10deg, #29805A 0%, #34D690 100%)'
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: '50%',
          width: 260,
          height: 260,
          borderRadius: '100%',
          transform: 'translateX(-50%) translateY(-140px)',
          background: 'linear-gradient(-40deg, #03738C 0%, #04C4D9 100%)'
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 340,
          height: 340,
          borderRadius: '100%',
          transform: 'translateY(-80px)',
          background: 'linear-gradient(-90deg, #D95560 0%, #FF6370 100%)'
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 230
        }}>
        <Logo />
      </div>
    </div>
  )
}
