import { useMutation } from '@apollo/client/react';
import {
  CreateSessionWithWepublishLoginDocument,
  LocalStorageKey,
} from '@wepublish/editor/api';
import {
  AuthDispatchActionType,
  AuthDispatchContext,
  LoginTemplate,
} from '@wepublish/ui/editor';
import { useContext, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { Background } from './ui/loginBackground';
import {
  captureWepublishLoginResult,
  isForbidden,
  takeCapturedWepublishLoginResult,
  takeWepublishLoginAttempt,
} from './wepublishLogin';

function takeLogin() {
  captureWepublishLoginResult();

  const result = takeCapturedWepublishLoginResult();
  const attempt = result ? takeWepublishLoginAttempt(result.state) : null;

  return result && attempt ?
      { code: result.code, codeVerifier: attempt.verifier }
    : null;
}

export function LoginWepublish() {
  const navigate = useNavigate();
  const authDispatch = useContext(AuthDispatchContext);
  const { t } = useTranslation();

  const [authenticate] = useMutation(CreateSessionWithWepublishLoginDocument);
  const [login] = useState(takeLogin);
  const [error, setError] = useState(
    login ? undefined : 'login.wepublish.failed'
  );
  const started = useRef(false);

  useEffect(() => {
    if (!login || started.current) {
      return;
    }

    started.current = true;

    authenticate({ variables: login })
      .then(response => {
        const session = response.data?.createSessionWithWepublishLogin;

        if (!session) {
          setError('login.wepublish.failed');
          return;
        }

        const permissions = session.user.roles.flatMap(role =>
          role.permissions.map(permission => permission.id)
        );

        if (!permissions.includes('CAN_LOGIN_EDITOR')) {
          setError('login.unauthorized');
          return;
        }

        localStorage.setItem(LocalStorageKey.SessionToken, session.token);

        authDispatch({
          type: AuthDispatchActionType.Login,
          payload: {
            email: session.user.email,
            sessionToken: session.token,
            sessionRoles: session.user.roles,
          },
        });

        navigate('/', { replace: true });
      })
      .catch(error =>
        setError(
          isForbidden(error) ?
            'login.wepublish.forbidden'
          : 'login.wepublish.failed'
        )
      );
  }, [authenticate, authDispatch, login, navigate]);

  return (
    <LoginTemplate backgroundChildren={<Background />}>
      <p>{t(error ?? 'login.wepublish.pending')}</p>
      {error && <a href="/login">{t('login.wepublish.backToLogin')}</a>}
    </LoginTemplate>
  );
}
