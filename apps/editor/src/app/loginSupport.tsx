import { useMutation } from '@apollo/client/react';
import {
  CreateSessionWithJwtDocument,
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

import {
  captureSupportLoginResult,
  takeCapturedSupportLoginResult,
  takeSupportLoginAttempt,
} from './supportLogin';
import { Background } from './ui/loginBackground';

export function LoginSupport() {
  const navigate = useNavigate();
  const authDispatch = useContext(AuthDispatchContext);
  const { t } = useTranslation();

  const [authenticateWithJWT] = useMutation(CreateSessionWithJwtDocument);
  const [error, setError] = useState<string>();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) {
      return;
    }

    started.current = true;

    captureSupportLoginResult();

    const result = takeCapturedSupportLoginResult();
    const attempt = result ? takeSupportLoginAttempt(result.state) : null;

    if (!result || !attempt) {
      setError(t('login.support.failed'));
      return;
    }

    authenticateWithJWT({
      variables: { jwt: result.code, codeVerifier: attempt.verifier },
    })
      .then(response => {
        const session = response.data?.createSessionWithJWT;

        if (!session?.impersonated) {
          setError(t('login.support.failed'));
          return;
        }

        const permissions = session.user.roles.flatMap(role =>
          role.permissions.map(permission => permission.id)
        );

        if (!permissions.includes('CAN_LOGIN_EDITOR')) {
          setError(t('login.unauthorized'));
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
      .catch(() => setError(t('login.support.failed')));
  }, [authenticateWithJWT, authDispatch, navigate, t]);

  return (
    <LoginTemplate backgroundChildren={<Background />}>
      <p>{error ?? t('login.support.pending')}</p>
      {error && <a href="/login">{t('login.support.backToLogin')}</a>}
    </LoginTemplate>
  );
}
