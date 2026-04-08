import { useUser } from '@wepublish/authentication/website';
import {
  useLoginWithJwtMutation,
  SessionWithTokenWithoutUser,
} from '@wepublish/website/api';
import { ComponentType, memo, useEffect } from 'react';

export const withJwtHandler = <
  // eslint-disable-next-line @typescript-eslint/ban-types
  P extends object,
>(
  ControlledComponent: ComponentType<P>
) =>
  memo<P>(props => {
    const [loginWithJwt] = useLoginWithJwtMutation();
    const { setToken } = useUser();

    useEffect(() => {
      const handleJwt = (jwt: string) => {
        loginWithJwt({ variables: { jwt } })
          .then(result => {
            if (result?.data?.createSessionWithJWT) {
              setToken(
                result.data.createSessionWithJWT as SessionWithTokenWithoutUser
              );
            }
          })
          .catch(() => {
            // Prevent unhandled promise rejection when the JWT is expired or
            // invalid (e.g. on profile pages where getInitialProps already
            // handles the JWT server-side and returns expiredJwt: true).
          });
      };

      if (window.opener) {
        const isTrustedMessage = (event: MessageEvent): boolean =>
          event.source === window.opener;

        // Receive JWT via postMessage from the editor — JWT never appears in the URL
        const handleMessage = (event: MessageEvent) => {
          if (!isTrustedMessage(event)) {
            return;
          }

          const jwt = event.data?.previewJwt;
          if (jwt) {
            window.removeEventListener('message', handleMessage);
            handleJwt(jwt);
          }
        };
        window.addEventListener('message', handleMessage);

        // Signal parent we're ready; retry until acknowledged
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

      // Fallback: JWT passed via URL param (e.g. direct link)
      const url = new URL(window.location.href);
      const jwt = url.searchParams.get('jwt');
      if (jwt) {
        url.searchParams.delete('jwt');
        window.history.replaceState(null, '', url.toString());
        handleJwt(jwt);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return <ControlledComponent {...(props as P)} />;
  });
