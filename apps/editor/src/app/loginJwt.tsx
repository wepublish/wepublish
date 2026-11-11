import { useMutation } from '@apollo/client/react';
import styled from '@emotion/styled';
import { Alert, Button, Stack, TextField, Typography } from '@mui/material';
import {
  CreateSessionWithJwtDocument,
  EnableTotpDocument,
  GenerateTotpSetupDocument,
  LocalStorageKey,
} from '@wepublish/editor/api';
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
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

import { Background } from './ui/loginBackground';
import { TotpQrCode } from './ui/totpQrCode';

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

  const [authenticateWithJWT] = useMutation(CreateSessionWithJwtDocument);
  const [generateTotpSetup, { loading: loadingSetup }] = useMutation(
    GenerateTotpSetupDocument
  );
  const [enableTotp, { loading: loadingEnable }] =
    useMutation(EnableTotpDocument);

  const [step, setStep] = useState<'loading' | 'totp-setup'>('loading');
  const [email, setEmail] = useState('');
  const [totpUri, setTotpUri] = useState('');
  const [totpSecret, setTotpSecret] = useState('');
  const [totpToken, setTotpToken] = useState('');
  const [error, setError] = useState('');
  const [setupError, setSetupError] = useState('');
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
        setSetupError(t('login.totp.setupError'));
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
    setError('');

    try {
      const response = await enableTotp({ variables: { totpToken } });

      if (response.data?.enableTotp) {
        enqueueSnackbar(t('login.totp.setupSuccess'), {
          variant: 'success',
          autoHideDuration: 3000,
        });

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
      setError(message);
      setTotpToken('');
    }
  }

  if (step === 'loading') {
    return (
      <LoginTemplate
        title={t('login.login')}
        backgroundChildren={<Background />}
      >
        <Typography>{t('login.jwt')}</Typography>
      </LoginTemplate>
    );
  }

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
