import { useLazyQuery, useMutation } from '@apollo/client/react';
import styled from '@emotion/styled';
import { Alert, Button, Stack, TextField } from '@mui/material';
import {
  CheckLoginOtpDocument,
  CreateSessionDocument,
  EnableTotpDocument,
  FullUserRoleFragment,
  GenerateTotpSetupDocument,
  LocalStorageKey,
} from '@wepublish/editor/api';
import { CanLoginEditor } from '@wepublish/permissions';
import {
  AuthDispatchActionType,
  AuthDispatchContext,
  enqueueSnackbar,
  LoginTemplate,
} from '@wepublish/ui/editor';
import {
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

import { Background } from './ui/loginBackground';
import { TotpQrCode } from './ui/totpQrCode';

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

const Form = styled.form`
  display: flex;
  flex-direction: column;
  margin: 0;
`;

const SecretCode = styled.code`
  display: block;
  text-align: center;
  font-size: 14px;
  padding: 8px;
  background: ${({ theme }) => theme.vars.palette.background.default};
  border-radius: 4px;
  margin-bottom: 16px;
  word-break: break-all;
`;

const TotpDescription = styled.p`
  text-align: center;
  margin-bottom: 16px;
  font-size: 14px;
  color: ${({ theme }) => theme.vars.palette.text.secondary};
`;

const AppLinks = styled.p`
  text-align: center;
  margin-bottom: 16px;
  font-size: 13px;
  color: ${({ theme }) => theme.vars.palette.text.secondary};

  a {
    color: ${({ theme }) => theme.vars.palette.primary.main};
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }
`;

const ForgotPasswordLink = styled.a`
  display: block;
  color: ${({ theme }) => theme.vars.palette.primary.main};
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
  const [otpChecked, setOtpChecked] = useState(false);
  const [totpUri, setTotpUri] = useState('');
  const [totpSecret, setTotpSecret] = useState('');
  const [error, setError] = useState('');
  const [setupError, setSetupError] = useState('');

  const emailInputRef = useRef<HTMLInputElement>(null);
  const totpInputRef = useRef<HTMLInputElement>(null);

  const query = useQuery();
  const next = query.get('next');

  const authDispatch = useContext(AuthDispatchContext);
  const navigate = useNavigate();

  const [checkLoginOtp] = useLazyQuery(CheckLoginOtpDocument);
  const [authenticate, { loading }] = useMutation(CreateSessionDocument);
  const [generateTotpSetup, { loading: loadingSetup }] = useMutation(
    GenerateTotpSetupDocument
  );
  const [enableTotp, { loading: loadingEnable }] =
    useMutation(EnableTotpDocument);

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

      if (!permissions.includes(CanLoginEditor.id)) {
        setError(t('login.unauthorized'));
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

  const otpRequired = isValidEmail(email) && otpChecked;

  // Dynamically check OTP requirement when email changes
  useEffect(() => {
    if (!isValidEmail(email)) {
      return;
    }

    const timeout = setTimeout(async () => {
      const result = await checkLoginOtp({ variables: { email } });
      setOtpChecked(result.data?.checkLoginOtp ?? false);
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
    setError('');

    try {
      const response = await authenticate({
        variables: {
          email,
          password,
          totpToken: otpRequired ? totpToken : undefined,
        },
      });

      if (!response.data?.createSession) {
        return;
      }

      const { token, totpEnabled, user } = response.data.createSession;

      if (totpEnabled || user.totpExempt) {
        finalizeLogin(token, user.email, user.roles);
      } else {
        forceTotpSetup(token);
      }
    } catch (error: any) {
      setError(error?.message || t('login.unauthorized'));
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
    } catch {
      setSetupError(t('login.totp.setupError'));
    }
  }

  async function handleTotpSetup(e: FormEvent) {
    e.preventDefault();
    setError('');

    try {
      const response = await enableTotp({
        variables: { totpToken },
      });

      if (response.data?.enableTotp) {
        enqueueSnackbar(t('login.totp.setupSuccess'), {
          variant: 'success',
          autoHideDuration: 3000,
        });

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
      setError(error?.message || t('login.totp.invalidCode'));
      setTotpToken('');
    }
  }

  // --- TOTP Setup Screen ---
  if (loginStep === 'totp-setup') {
    return (
      <LoginTemplate
        title={t('login.login')}
        backgroundChildren={<Background />}
      >
        <Form>
          <Stack
            direction="column"
            spacing={3}
          >
            <TotpDescription>
              {t('login.totp.setupDescription')}
            </TotpDescription>

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
                <SecretCode data-sentry-mask>{totpSecret}</SecretCode>
              </>
            )}

            {setupError && <Alert severity="error">{setupError}</Alert>}

            <TextField
              label={<>{t('login.totp.code')}</>}
              inputRef={totpInputRef}
              name="totpCode"
              value={totpToken}
              autoComplete="one-time-code"
              error={Boolean(error)}
              onChange={event => {
                setTotpToken(event.target.value);
                setError('');
              }}
              fullWidth
            />

            {error && <Alert severity="error">{error}</Alert>}

            <Button
              variant="contained"
              type="submit"
              disabled={loadingEnable || loadingSetup || !totpToken}
              onClick={handleTotpSetup}
            >
              {t('login.totp.activate')}
            </Button>
          </Stack>
        </Form>
      </LoginTemplate>
    );
  }

  // --- Login Screen ---
  return (
    <LoginTemplate
      title={t('login.login')}
      backgroundChildren={<Background />}
    >
      <Form>
        <Stack
          direction="column"
          spacing={3}
        >
          <TextField
            label={<>{t('login.email')}</>}
            inputRef={emailInputRef}
            name="username"
            value={email}
            autoComplete="username"
            error={Boolean(error)}
            onChange={event => {
              setEmail(event.target.value);
              setError('');
            }}
            fullWidth
          />

          <TextField
            label={<>{t('login.password')}</>}
            name="password"
            type="password"
            value={password}
            autoComplete="current-password"
            error={Boolean(error)}
            onChange={event => {
              setPassword(event.target.value);
              setError('');
            }}
            fullWidth
          />

          {otpRequired && (
            <TextField
              label={<>{t('login.totp.code')}</>}
              name="totpCode"
              value={totpToken}
              autoComplete="one-time-code"
              error={Boolean(error)}
              onChange={event => {
                setTotpToken(event.target.value);
                setError('');
              }}
              fullWidth
            />
          )}

          {error && <Alert severity="error">{error}</Alert>}

          <Button
            variant="contained"
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
        </Stack>
      </Form>
    </LoginTemplate>
  );
}
