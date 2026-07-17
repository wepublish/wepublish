import {
  useUser,
  AuthTokenStorageKey,
} from '@wepublish/authentication/website';
import { getCookie } from 'cookies-next';
import {
  useLoginWithJwtMutation,
  SessionWithTokenWithoutUser,
} from '@wepublish/website/api';
import styled from '@emotion/styled';
import {
  ComponentType,
  createElement,
  memo,
  useCallback,
  useEffect,
  useState,
} from 'react';

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

export const withJwtHandler = <
  // eslint-disable-next-line @typescript-eslint/ban-types
  P extends object,
>(
  ControlledComponent: ComponentType<P>
) =>
  memo<P>(props => {
    const [loginWithJwt] = useLoginWithJwtMutation();
    const { setToken } = useUser();

    const [showTotpPrompt, setShowTotpPrompt] = useState(false);
    const [pendingJwt, setPendingJwt] = useState<string | null>(null);
    const [totpToken, setTotpToken] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>();

    const handleJwt = useCallback(
      (jwt: string, options?: { fromPreview?: boolean }) => {
        // Skip if already signed in (check cookie synchronously)
        if (getCookie(AuthTokenStorageKey)) return;

        loginWithJwt({ variables: { jwt } })
          .then(result => {
            if (result?.data?.createSessionWithJWT) {
              setToken(
                result.data.createSessionWithJWT as SessionWithTokenWithoutUser
              );
            }
          })
          .catch(err => {
            if (err?.message?.includes('TOTP_REQUIRED')) {
              setPendingJwt(jwt);
              setShowTotpPrompt(true);
              return;
            }

            // Preview JWTs fail silently — the user can't act on them
            if (options?.fromPreview) return;

            window.location.href = `/login?error=${encodeURIComponent(
              EXPIRED_JWT_MESSAGE
            )}`;
          });
      },
      [loginWithJwt, setToken]
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
          setToken(
            result.data.createSessionWithJWT as SessionWithTokenWithoutUser
          );
          setShowTotpPrompt(false);
          setPendingJwt(null);
        }
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
    }, [pendingJwt, totpToken, loginWithJwt, setToken]);

    const handleCancel = useCallback(() => {
      setShowTotpPrompt(false);
      setPendingJwt(null);
      setTotpToken('');
      setError(undefined);
    }, []);

    useEffect(() => {
      if (window.opener) {
        const isTrustedMessage = (event: MessageEvent): boolean =>
          event.source === window.opener;

        const handleMessage = (event: MessageEvent) => {
          if (!isTrustedMessage(event)) {
            return;
          }

          const jwt = event.data?.previewJwt;
          if (jwt) {
            window.removeEventListener('message', handleMessage);
            handleJwt(jwt, { fromPreview: true });
          }
        };
        window.addEventListener('message', handleMessage);

        const MAX_ATTEMPTS = 25;
        let attempts = 0;
        const interval = setInterval(() => {
          window.opener.postMessage('preview-jwt-ready', '*');
          if (++attempts >= MAX_ATTEMPTS) clearInterval(interval);
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
              <TotpTitle>Zwei-Faktor-Authentifizierung</TotpTitle>

              <TotpInfo>
                Bitte gib den 6-stelligen Code aus deiner Authenticator-App ein.
              </TotpInfo>

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
                  Abbrechen
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
                  Bestätigen
                </button>
              </ButtonRow>
            </TotpDialog>
          </TotpOverlay>
        )}
      </>
    );
  });
