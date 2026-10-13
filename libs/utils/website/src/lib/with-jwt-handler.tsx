import { useMutation } from '@apollo/client/react';
import { useApolloClient } from '@apollo/client/react';
import {
  getPreviewHost,
  setPreviewHandshakeState,
  useUser,
} from '@wepublish/authentication/website';
import { LoginWithJwtDocument } from '@wepublish/website/api';
import styled from '@emotion/styled';
import {
  ComponentType,
  createElement,
  memo,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';

export const EXPIRED_JWT_MESSAGE =
  'Dieser Link ist nicht mehr gültig. Bitte hier einen neuen Link anfordern oder mit Benutzernamen und Passwort anmelden.';

const TotpOverlay = styled('div')`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
`;

const TotpDialog = styled('div')`
  background: white;
  border-radius: 8px;
  padding: 32px;
  max-width: 400px;
  width: 90%;
  display: grid;
  gap: 16px;
`;

const TotpTitle = styled('h3')`
  margin: 0;
  font-size: 18px;
`;

const TotpInfo = styled('p')`
  margin: 0;
  font-size: 14px;
  color: #555;
`;

const TotpInput = styled('input')`
  width: 100%;
  padding: 12px;
  font-size: 16px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
  &:focus {
    outline: none;
    border-color: #333;
  }
`;

const TotpError = styled('p')`
  margin: 0;
  color: #d32f2f;
  font-size: 14px;
`;

const ButtonRow = styled('div')`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
`;

export const withJwtHandler = <P extends object>(
  ControlledComponent: ComponentType<P>
) =>
  memo<P>(props => {
    const client = useApolloClient();
    const [loginWithJwt] = useMutation(LoginWithJwtDocument);
    const { setToken, hasUser } = useUser();
    const { t } = useTranslation();

    const [showTotpPrompt, setShowTotpPrompt] = useState(false);
    const [pendingJwt, setPendingJwt] = useState<string | null>(null);
    const [totpToken, setTotpToken] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>();

    const refreshStore = useCallback(
      () =>
        client.refetchQueries({ include: 'active' }).catch(err => {
          console.warn(
            '[jwt] refreshing the store after login failed:',
            err?.message ?? err
          );
        }),
      [client]
    );

    const handleJwt = useCallback(
      (jwt: string, options?: { fromPreview?: boolean }) => {
        if (hasUser && !options?.fromPreview) {
          return;
        }

        loginWithJwt({ variables: { jwt } })
          .then(async result => {
            if (result?.data?.createSessionWithJWT) {
              await setToken({
                __typename: 'SessionWithTokenWithoutUser',
                token: result.data.createSessionWithJWT.token,
                expiresAt: result.data.createSessionWithJWT.expiresAt,
                createdAt: result.data.createSessionWithJWT.createdAt,
              });

              if (options?.fromPreview) {
                setPreviewHandshakeState('succeeded');
              }

              await refreshStore();
            }
          })
          .catch(err => {
            if (err?.message?.includes('TOTP_REQUIRED')) {
              setPendingJwt(jwt);
              setShowTotpPrompt(true);

              return;
            }

            if (options?.fromPreview) {
              setPreviewHandshakeState('failed');
              console.warn('[preview] JWT login failed:', err?.message ?? err);

              return;
            }

            window.location.href = `/login?error=${encodeURIComponent(
              EXPIRED_JWT_MESSAGE
            )}`;
          });
      },
      [loginWithJwt, setToken, hasUser, refreshStore]
    );

    const handleTotpSubmit = useCallback(async () => {
      if (!pendingJwt || !totpToken) return;

      setLoading(true);
      setError(undefined);

      try {
        const result = await loginWithJwt({
          variables: { jwt: pendingJwt, totpToken },
        });

        if (result?.data?.createSessionWithJWT) {
          await setToken({
            __typename: 'SessionWithTokenWithoutUser',
            token: result.data.createSessionWithJWT.token,
            expiresAt: result.data.createSessionWithJWT.expiresAt,
            createdAt: result.data.createSessionWithJWT.createdAt,
          });
          setShowTotpPrompt(false);
          setPendingJwt(null);
          setPreviewHandshakeState('succeeded');

          await refreshStore();
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        setError(
          err?.message?.includes('TOTP_REQUIRED') ?
            undefined
          : (err?.message ?? 'Invalid code. Please try again.')
        );
        setTotpToken('');
      } finally {
        setLoading(false);
      }
    }, [pendingJwt, totpToken, loginWithJwt, setToken, refreshStore]);

    const handleCancel = useCallback(() => {
      setShowTotpPrompt(false);
      setPendingJwt(null);
      setTotpToken('');
      setError(undefined);
    }, []);

    useEffect(() => {
      const previewHost = getPreviewHost();

      if (previewHost) {
        setPreviewHandshakeState('pending');

        const isTrustedMessage = (event: MessageEvent): boolean =>
          event.source === previewHost;

        let received = false;

        const handleMessage = (event: MessageEvent) => {
          if (!isTrustedMessage(event)) {
            return;
          }

          const jwt = event.data?.previewJwt;
          if (jwt) {
            received = true;
            window.removeEventListener('message', handleMessage);
            clearInterval(interval);
            previewHost.postMessage('preview-jwt-received', '*');
            handleJwt(jwt, { fromPreview: true });
          }
        };
        window.addEventListener('message', handleMessage);

        const MAX_ATTEMPTS = 150;
        let attempts = 0;
        const interval = setInterval(() => {
          previewHost.postMessage('preview-jwt-ready', '*');

          if (++attempts >= MAX_ATTEMPTS) {
            clearInterval(interval);

            if (!received) {
              setPreviewHandshakeState('failed');
              console.warn(
                '[preview] no JWT received from the host window within 30s'
              );
            }
          }
        }, 200);

        return () => {
          window.removeEventListener('message', handleMessage);
          clearInterval(interval);
        };
      }

      const url = new URL(window.location.href);
      const jwt = url.searchParams.get('jwt');
      if (jwt) {
        url.searchParams.delete('jwt');
        window.history.replaceState(null, '', url.toString());
        handleJwt(jwt);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
      <>
        {createElement(ControlledComponent, props as P)}

        {showTotpPrompt && (
          <TotpOverlay onClick={handleCancel}>
            <TotpDialog onClick={e => e.stopPropagation()}>
              <TotpTitle>{t('login.totp.verifyTitle')}</TotpTitle>

              <TotpInfo>{t('login.totp.verifyDescription')}</TotpInfo>

              <TotpInput
                value={totpToken}
                onChange={e => setTotpToken(e.target.value)}
                autoComplete="one-time-code"
                autoFocus
                placeholder="000000"
                onKeyDown={e => {
                  if (e.key === 'Enter') handleTotpSubmit();
                }}
              />

              {error && <TotpError>{error}</TotpError>}

              <ButtonRow>
                <button
                  onClick={handleCancel}
                  style={{
                    padding: '12px 24px',
                    fontSize: 16,
                    background: 'transparent',
                    color: '#555',
                    border: '1px solid #ccc',
                    borderRadius: 4,
                    cursor: 'pointer',
                  }}
                >
                  {t('user.cancel')}
                </button>
                <button
                  disabled={loading || !totpToken}
                  onClick={handleTotpSubmit}
                  style={{
                    padding: '12px 24px',
                    fontSize: 16,
                    background: loading || !totpToken ? '#ccc' : '#333',
                    color: loading || !totpToken ? '#999' : 'white',
                    border: 'none',
                    borderRadius: 4,
                    cursor: loading || !totpToken ? 'default' : 'pointer',
                  }}
                >
                  {t('user.confirm')}
                </button>
              </ButtonRow>
            </TotpDialog>
          </TotpOverlay>
        )}
      </>
    );
  });
