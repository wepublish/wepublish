import React, {useState, useContext, FormEvent, useEffect} from 'react'
import {RouteActionType} from '@karma.run/react'

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
  useCreateSessionMutation,
  useGetAuthProvidersQuery
} from './api'

import {useTranslation} from 'react-i18next'
import {
  ControlLabel,
  Button,
  Form,
  FormControl,
  FormGroup,
  Divider,
  Icon,
  Notification
} from 'rsuite'
import {SVGIcon} from 'rsuite/lib/@types/common'
import {IconNames} from 'rsuite/lib/Icon/Icon'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const {current} = useRoute()

  const authDispatch = useContext(AuthDispatchContext)
  const routeDispatch = useRouteDispatch()

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

  const {t} = useTranslation()

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
      Notification.error({
        title: error.message,
        duration: 5000
      })
    }
    if (errorOAuth2) {
      Notification.error({
        title: errorOAuth2.message,
        duration: 5000
      })
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

  function getAuthLogo(name: string): IconNames | SVGIcon {
    switch (name) {
      case 'google':
        return 'google'
      case 'facebook':
        return 'facebook'
      case 'twitter':
        return 'twitter'
      default:
        return 'space-shuttle'
    }
  }

  return (
    <LoginTemplate backgroundChildren={<Background />}>
      {!loadingOAuth2 && (
        <>
          <Form
            fluid={true}
            style={{
              display: 'flex',
              flexDirection: 'column',
              margin: 0
            }}>
            <FormGroup>
              <ControlLabel>{t('login.email')}</ControlLabel>
              <FormControl
                value={email}
                autoComplete={'username'}
                onChange={email => setEmail(email)}
              />
            </FormGroup>
            <FormGroup>
              <ControlLabel>{t('login.password')}</ControlLabel>
              <FormControl
                type="password"
                value={password}
                autoComplete={'currentPassword'}
                onChange={password => setPassword(password)}
              />
            </FormGroup>
            <Button appearance="primary" disabled={loading} onClick={login}>
              {t('Login')}
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
                    icon={<Icon icon={getAuthLogo(provider.name)} />}>
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
