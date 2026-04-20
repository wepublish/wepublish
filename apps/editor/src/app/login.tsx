import styled from '@emotion/styled';
import {
  FullUserRoleFragment,
  LocalStorageKey,
  useCheckLoginOtpLazyQuery,
  useCreateSessionMutation,
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
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Button,
  Form as RForm,
  IconButton as RIconButton,
  Message,
  toaster,
} from 'rsuite';

import { Background } from './ui/loginBackground';
import { TotpQrCode } from './ui/totpQrCode';

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

const ForgotPasswordLink = styled.a`
  display: block;
  color: #1675e0;
  font-size: 13px;
  cursor: pointer;
  margin-top: 8px;
  text-align: center;
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

type LoginStep = 'login' | 'totp-setup';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totpToken, setTotpToken] = useState('');
  const [loginStep, setLoginStep] = useState<LoginStep>('login');
  const [otpRequired, setOtpRequired] = useState(false);
  const [totpUri, setTotpUri] = useState('');
  const [totpSecret, setTotpSecret] = useState('');

  const emailInputRef = useRef<HTMLInputElement>(null);
  const totpInputRef = useRef<HTMLInputElement>(null);

  const query = useQuery();
  const next = query.get('next');

  const authDispatch = useContext(AuthDispatchContext);
  const navigate = useNavigate();

  const [checkLoginOtp] = useCheckLoginOtpLazyQuery();
  const [authenticate, { loading }] = useCreateSessionMutation();
  const [generateTotpSetup, { loading: loadingSetup }] =
    useGenerateTotpSetupMutation();
  const [enableTotp, { loading: loadingEnable }] = useEnableTotpMutation();

  const { t } = useTranslation();

  const finalizeLogin = useCallback(
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

  // Dynamically check OTP requirement when email changes
  useEffect(() => {
    if (!isValidEmail(email)) {
      setOtpRequired(false);
      return;
    }

    const timeout = setTimeout(async () => {
      const result = await checkLoginOtp({ variables: { email } });
      setOtpRequired(result.data?.checkLoginOtp ?? false);
    }, 300);

    return () => clearTimeout(timeout);
  }, [email, checkLoginOtp]);

  useEffect(() => {
    if (loginStep === 'login' && emailInputRef.current) {
      emailInputRef.current.focus();
    }
    if (loginStep === 'totp-setup' && totpInputRef.current) {
      totpInputRef.current.focus();
    }
  }, [loginStep]);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();

    try {
      const response = await authenticate({
        variables: {
          email,
          password,
          totpToken: otpRequired ? totpToken : undefined,
        },
      });

      if (!response.data?.createSession) return;

      const { token, totpEnabled, user } = response.data.createSession;

      if (totpEnabled || user.totpExempt) {
        finalizeLogin(token, user.email, user.roles);
      } else {
        forceTotpSetup(token);
      }
    } catch (error: any) {
      toaster.push(
        <Message
          type="error"
          showIcon
          closable
          duration={5000}
        >
          {error?.message || t('login.unauthorized')}
        </Message>
      );
      setTotpToken('');
    }
  }

  async function forceTotpSetup(sessionToken: string) {
    localStorage.setItem(LocalStorageKey.SessionToken, sessionToken);
    setLoginStep('totp-setup');

    try {
      const setupResponse = await generateTotpSetup();
      if (setupResponse.data?.generateTotpSetup) {
        setTotpUri(setupResponse.data.generateTotpSetup.uri);
        setTotpSecret(setupResponse.data.generateTotpSetup.secret);
      }
    } catch (error) {
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
  }

  async function handleTotpSetup(e: FormEvent) {
    e.preventDefault();

    try {
      const response = await enableTotp({
        variables: { totpToken },
      });

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

        authDispatch({
          type: AuthDispatchActionType.Login,
          payload: {
            email,
            sessionToken: localStorage.getItem(LocalStorageKey.SessionToken)!,
          },
        });

        if (next) {
          navigate(next, { replace: true });
          return;
        }

        navigate('/', { replace: true });
      }
    } catch (error: any) {
      toaster.push(
        <Message
          type="error"
          showIcon
          closable
          duration={5000}
        >
          {error?.message || t('login.totp.invalidCode')}
        </Message>
      );
      setTotpToken('');
    }
  }

  // --- TOTP Setup Screen ---
  if (loginStep === 'totp-setup') {
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

  // --- Login Screen ---
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
            autoComplete="username"
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
            autoComplete="current-password"
            onChange={(password: string) => setPassword(password)}
          />
        </Group>
        {otpRequired && (
          <Group controlId="loginTotp">
            <ControlLabel>{t('login.totp.code')}</ControlLabel>
            <Control
              name="totpCode"
              value={totpToken}
              autoComplete="one-time-code"
              onChange={(value: string) => setTotpToken(value)}
            />
          </Group>
        )}
        <Button
          appearance="primary"
          type="submit"
          disabled={loading}
          onClick={handleLogin}
        >
          {t('login.login')}
        </Button>
        <ForgotPasswordLink
          href={`/login/reset-password${email ? `?email=${encodeURIComponent(email)}` : ''}`}
        >
          {t('login.forgotPassword')}
        </ForgotPasswordLink>
      </Form>
    </LoginTemplate>
  );
}
