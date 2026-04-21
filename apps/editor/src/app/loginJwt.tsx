import styled from '@emotion/styled';
import {
  LocalStorageKey,
  useCreateSessionWithJwtMutation,
  useEnableTotpMutation,
  useGenerateTotpSetupMutation,
} from '@wepublish/editor/api';
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
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Form as RForm, Message, toaster } from 'rsuite';

import { Background } from './ui/loginBackground';
import { TotpQrCode } from './ui/totpQrCode';

const { Group, ControlLabel, Control } = RForm;

const Form = styled(RForm)`
  display: flex;
  flex-direction: column;
  margin: 0;
`;

const SecretCode = styled.code`
  display: block;
  text-align: center;
  font-size: 14px;
  padding: 8px;
  background: #f5f5f5;
  border-radius: 4px;
  margin-bottom: 16px;
  word-break: break-all;
`;

const TotpDescription = styled.p`
  text-align: center;
  margin-bottom: 16px;
  font-size: 14px;
  color: #555;
`;

const AppLinks = styled.p`
  text-align: center;
  margin-bottom: 16px;
  font-size: 13px;
  color: #555;

  a {
    color: #1675e0;
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }
`;

/**
 * Handles JWT login links. The JWT comes from the URL route param.
 * If the user has no TOTP and is not exempt, forces TOTP setup.
 * Otherwise, redirects to normal login.
 */
export function LoginJwt() {
  const { jwt } = useParams<{ jwt: string }>();
  const navigate = useNavigate();
  const authDispatch = useContext(AuthDispatchContext);
  const { t } = useTranslation();

  const [authenticateWithJWT] = useCreateSessionWithJwtMutation();
  const [generateTotpSetup, { loading: loadingSetup }] =
    useGenerateTotpSetupMutation();
  const [enableTotp, { loading: loadingEnable }] = useEnableTotpMutation();

  const [step, setStep] = useState<'loading' | 'totp-setup'>('loading');
  const [email, setEmail] = useState('');
  const [totpUri, setTotpUri] = useState('');
  const [totpSecret, setTotpSecret] = useState('');
  const [totpToken, setTotpToken] = useState('');
  const totpInputRef = useRef<HTMLInputElement>(null);

  const forceTotpSetup = useCallback(
    async (sessionToken: string) => {
      localStorage.setItem(LocalStorageKey.SessionToken, sessionToken);
      setStep('totp-setup');

      try {
        const setupResponse = await generateTotpSetup();
        if (setupResponse.data?.generateTotpSetup) {
          setTotpUri(setupResponse.data.generateTotpSetup.uri);
          setTotpSecret(setupResponse.data.generateTotpSetup.secret);
        }
      } catch {
        toaster.push(
          <Message
            type="error"
            showIcon
            closable
            duration={5000}
          >
            {t('login.totp.setupError')}
          </Message>
        );
      }
    },
    [generateTotpSetup, t]
  );

  useEffect(() => {
    if (!jwt) {
      navigate('/login', { replace: true });
      return;
    }

    authenticateWithJWT({ variables: { jwt } })
      .then(response => {
        const session = response.data?.createSessionWithJWT;
        if (!session) {
          navigate('/login', { replace: true });
          return;
        }

        const { token, totpEnabled, user } = session;

        if (!totpEnabled && !user.totpExempt) {
          setEmail(user.email);
          forceTotpSetup(token);
        } else {
          navigate('/login', { replace: true });
        }
      })
      .catch(() => {
        navigate('/login', { replace: true });
      });
  }, [jwt, authenticateWithJWT, navigate, forceTotpSetup]);

  useEffect(() => {
    if (step === 'totp-setup') {
      totpInputRef.current?.focus();
    }
  }, [step]);

  async function handleTotpSetup(e: FormEvent) {
    e.preventDefault();

    try {
      const response = await enableTotp({ variables: { totpToken } });

      if (response.data?.enableTotp) {
        toaster.push(
          <Message
            type="success"
            showIcon
            closable
            duration={3000}
          >
            {t('login.totp.setupSuccess')}
          </Message>
        );

        const sessionToken = localStorage.getItem(LocalStorageKey.SessionToken);
        if (!sessionToken) {
          navigate('/login', { replace: true });
          return;
        }

        authDispatch({
          type: AuthDispatchActionType.Login,
          payload: {
            email,
            sessionToken,
          },
        });

        navigate('/', { replace: true });
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : t('login.totp.invalidCode');
      toaster.push(
        <Message
          type="error"
          showIcon
          closable
          duration={5000}
        >
          {message}
        </Message>
      );
      setTotpToken('');
    }
  }

  if (step === 'loading') {
    return (
      <LoginTemplate backgroundChildren={<Background />}>
        <p>{t('login.jwt')}</p>
      </LoginTemplate>
    );
  }

  return (
    <LoginTemplate backgroundChildren={<Background />}>
      <Form fluid>
        <TotpDescription>{t('login.totp.setupDescription')}</TotpDescription>

        <AppLinks>
          {t('login.totp.downloadApp')}{' '}
          <a
            href="https://play.google.com/store/apps/details?id=proton.android.authenticator"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('login.totp.android')}
          </a>
          {' | '}
          <a
            href="https://apps.apple.com/app/proton-authenticator/id6741758667"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('login.totp.ios')}
          </a>
        </AppLinks>

        <TotpDescription>{t('login.totp.backupHint')}</TotpDescription>

        {totpUri && <TotpQrCode uri={totpUri} />}

        {totpSecret && (
          <>
            <TotpDescription>{t('login.totp.manualEntry')}</TotpDescription>
            <SecretCode>{totpSecret}</SecretCode>
          </>
        )}

        <Group controlId="totpCode">
          <ControlLabel>{t('login.totp.code')}</ControlLabel>
          <Control
            inputRef={totpInputRef}
            name="totpCode"
            value={totpToken}
            autoComplete="one-time-code"
            onChange={(value: string) => setTotpToken(value)}
          />
        </Group>
        <Button
          appearance="primary"
          type="submit"
          disabled={loadingEnable || loadingSetup || !totpToken}
          onClick={handleTotpSetup}
        >
          {t('login.totp.activate')}
        </Button>
      </Form>
    </LoginTemplate>
  );
}
