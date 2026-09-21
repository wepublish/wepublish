import {
  LocalStorageKey,
  useCreateSessionWithJwtMutation,
} from '@wepublish/editor/api';
import {
  AuthDispatchActionType,
  AuthDispatchContext,
  LoginTemplate,
} from '@wepublish/ui/editor';
import { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

import { Background } from './ui/loginBackground';

/**
 * Redeems an impersonation grant issued by the One dashboard and signs the
 * operator straight in as the target user.
 *
 * Unlike the ordinary JWT link this route skips TOTP, so it accepts nothing but
 * an impersonation grant: the API marks those sessions with `impersonated`, and
 * a session without that flag is discarded rather than used. Otherwise any
 * magic-link JWT pointed at this URL would become a way around two-factor.
 */
export function LoginImpersonate() {
  const { jwt } = useParams<{ jwt: string }>();
  const navigate = useNavigate();
  const authDispatch = useContext(AuthDispatchContext);
  const { t } = useTranslation();

  const [authenticateWithJWT] = useCreateSessionWithJwtMutation();
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!jwt) {
      navigate('/login', { replace: true });
      return;
    }

    authenticateWithJWT({ variables: { jwt } })
      .then(response => {
        const session = response.data?.createSessionWithJWT;

        if (!session?.impersonated) {
          setError(t('login.impersonate.notAGrant'));
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
      .catch(() => setError(t('login.impersonate.failed')));
  }, [jwt, authenticateWithJWT, authDispatch, navigate, t]);

  return (
    <LoginTemplate backgroundChildren={<Background />}>
      <p>{error ?? t('login.impersonate.pending')}</p>
    </LoginTemplate>
  );
}
