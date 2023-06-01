import styled from '@emotion/styled'
import {
  FullUserRoleFragment,
  useCreateSessionMutation,
  useCreateSessionWithJwtMutation,
  useCreateSessionWithOAuth2CodeMutation,
  useGetAuthProvidersQuery
} from '@wepublish/editor/api'
import {
  AuthDispatchActionType,
  AuthDispatchContext,
  LocalStorageKey,
  LoginTemplate
} from '@wepublish/ui/editor'
import React, {FormEvent, useContext, useEffect, useMemo, useRef, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {IoIosRocket, IoLogoFacebook, IoLogoGoogle, IoLogoTwitter} from 'react-icons/io'
import {Link, useLocation, useNavigate, useParams} from 'react-router-dom'
import {Button, Divider, Form as RForm, IconButton as RIconButton, Message, toaster} from 'rsuite'

import {Background} from './ui/loginBackground'

function useQuery() {
  const {search} = useLocation()
  return useMemo(() => new URLSearchParams(search), [search])
}

const {Group, ControlLabel, Control} = RForm

const Form = styled(RForm)`
  display: flex;
  flex-direction: column;
  margin: 0;
`

const IconButton = styled(RIconButton)`
  margin-bottom: 10px;
`

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const emailInputRef = useRef<HTMLInputElement>(null)

  const location = useLocation()
  const params = useParams()
  const query = useQuery()
  const next = query.get('next')

  const authDispatch = useContext(AuthDispatchContext)
  const navigate = useNavigate()

  const [authenticate, {loading, error: errorLogin}] = useCreateSessionMutation()

  const [authenticateWithOAuth2Code, {loading: loadingOAuth2, error: errorOAuth2}] =
    useCreateSessionWithOAuth2CodeMutation()

  const [authenticateWithJWT, {loading: loadingJWT, error: errorJWT}] =
    useCreateSessionWithJwtMutation()

  const {data: providerData} = useGetAuthProvidersQuery({
    variables: {
      redirectUri: `${window.location.protocol}//${window.location.host}${window.location.pathname}/oauth`
    }
  })

  const {t} = useTranslation()

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
      payload: {
        email: responseEmail,
        sessionToken,
        sessionRoles: userRoles
      }
    })

    if (next) {
      navigate(next, {replace: true})
      return
    }
    navigate('/', {replace: true})
  }

  useEffect(() => {
    if (location && location.pathname === '/login/jwt' && params && params.jwt) {
      const {jwt} = params
      authenticateWithJWT({
        variables: {
          jwt
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
          navigate('/login', {replace: true})
        })
    } else if (location !== null && params && params.code && params.provider) {
      const {code, provider} = params
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
          navigate('/login', {replace: true})
        })
    }
  }, [location])

  useEffect(() => {
    const error = errorLogin?.message ?? errorOAuth2?.message ?? errorJWT?.message
    if (error)
      toaster.push(
        <Message type="error" showIcon closable duration={0}>
          {error}
        </Message>
      )
  }, [errorLogin, errorOAuth2, errorJWT])

  useEffect(() => {
    if (emailInputRef.current) {
      emailInputRef.current.focus()
    }
  }, [])

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

  function getAuthLogo(name: string): React.ReactElement {
    switch (name) {
      case 'google':
        return <IoLogoGoogle />
      case 'facebook':
        return <IoLogoFacebook />
      case 'twitter':
        return <IoLogoTwitter />
      default:
        return <IoIosRocket />
    }
  }

  return (
    <LoginTemplate backgroundChildren={<Background />}>
      {!loadingOAuth2 && (
        <>
          <Form fluid>
            <Group controlId="loginEmail">
              <ControlLabel>{t('login.email')}</ControlLabel>
              <Control
                inputRef={emailInputRef}
                name="username"
                className="username"
                value={email}
                autoComplete={'username'}
                onChange={(email: string) => setEmail(email)}
              />
            </Group>
            <Group controlId="loginPassword">
              <ControlLabel>{t('login.password')}</ControlLabel>
              <Control
                name="password"
                className="password"
                type="password"
                value={password}
                autoComplete={'currentPassword'}
                onChange={(password: string) => setPassword(password)}
              />
            </Group>
            <Button appearance="primary" type="submit" disabled={loading} onClick={login}>
              {t('login.login')}
            </Button>
          </Form>
          {!!providerData?.authProviders?.length && (
            <>
              <Divider />
              {providerData.authProviders.map(
                (provider: {url: string; name: string}, index: number) => (
                  <Link to={provider.url} key={index}>
                    <IconButton appearance="subtle" icon={getAuthLogo(provider.name)}>
                      {provider.name}
                    </IconButton>
                  </Link>
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
