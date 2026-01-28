import styled from '@emotion/styled';
import {
  FullUserRoleFragment,
  useCreateSessionMutation,
  useCreateSessionWithJwtMutation,
} from '@wepublish/editor/api';
import { LocalStorageKey } from '@wepublish/editor/api-v2';
import {
  AuthDispatchActionType,
  AuthDispatchContext,
  LoginTemplate,
} from '@wepublish/ui/editor';
import React, {
  FormEvent,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  Form as RForm,
  IconButton as RIconButton,
  Message,
  toaster,
} from 'rsuite';

import { Background } from './ui/loginBackground';

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

const { Group, ControlLabel, Control } = RForm;

const Form = styled(RForm)`
  display: flex;
  flex-direction: column;
  margin: 0;
`;

const IconButton = styled(RIconButton)`
  margin-bottom: 10px;
`;

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const emailInputRef = useRef<HTMLInputElement>(null);

  const location = useLocation();
  const params = useParams();
  const query = useQuery();
  const next = query.get('next');

  const authDispatch = useContext(AuthDispatchContext);
  const navigate = useNavigate();

  const [authenticate, { loading, error: errorLogin }] =
    useCreateSessionMutation();

  const [authenticateWithJWT, { loading: loadingJWT, error: errorJWT }] =
    useCreateSessionWithJwtMutation();

  const { t } = useTranslation();

  const authenticateUser = useCallback(
    (
      sessionToken: string,
      responseEmail: string,
      userRoles: FullUserRoleFragment[]
    ) => {
      const permissions = userRoles.reduce((permissions, userRole) => {
        return [
          ...permissions,
          ...userRole.permissions.map(permission => permission.id),
        ];
      }, [] as string[]);

      if (!permissions.includes('CAN_LOGIN_EDITOR')) {
        toaster.push(
          <Message
            type="error"
            showIcon
            closable
            duration={0}
          >
            {t('login.unauthorized')}
          </Message>
        );
        return;
      }

      localStorage.setItem(LocalStorageKey.SessionToken, sessionToken);

      authDispatch({
        type: AuthDispatchActionType.Login,
        payload: {
          email: responseEmail,
          sessionToken,
          sessionRoles: userRoles,
        },
      });

      if (next) {
        navigate(next, { replace: true });
        return;
      }

      navigate('/', { replace: true });
    },
    [authDispatch, navigate, next, t]
  );

  useEffect(() => {
    if (
      location &&
      location.pathname === '/login/jwt' &&
      params &&
      params.jwt
    ) {
      const { jwt } = params;
      authenticateWithJWT({
        variables: {
          jwt,
        },
      })
        .then((response: any) => {
          const {
            token: sessionToken,
            user: { email: responseEmail, roles },
          } = response.data.createSessionWithJWT;

          authenticateUser(sessionToken, responseEmail, roles);
        })
        .catch(error => {
          console.warn('auth error', error);
          navigate('/login', { replace: true });
        });
    }
  }, [authenticateUser, authenticateWithJWT, location, navigate, params]);

  useEffect(() => {
    const error = errorLogin?.message ?? errorJWT?.message;
    if (error)
      toaster.push(
        <Message
          type="error"
          showIcon
          closable
          duration={0}
        >
          {error}
        </Message>
      );
  }, [errorLogin, errorJWT]);

  useEffect(() => {
    if (emailInputRef.current) {
      emailInputRef.current.focus();
    }
  }, []);

  async function login(e: FormEvent) {
    e.preventDefault();

    const response = await authenticate({ variables: { email, password } });

    if (!response.data?.createSession) return;

    const {
      token: sessionToken,
      user: { email: responseEmail, roles },
    } = response.data.createSession;

    authenticateUser(sessionToken, responseEmail, roles);
  }

  return (
    <LoginTemplate backgroundChildren={<Background />}>
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
        <Button
          appearance="primary"
          type="submit"
          disabled={loading}
          onClick={login}
        >
          {t('login.login')}
        </Button>
      </Form>

      {loadingJWT && (
        <div>
          <p>{t('login.jwt')}</p>
        </div>
      )}
    </LoginTemplate>
  );
}
