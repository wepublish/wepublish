import {
  SessionWithTokenWithoutUser,
  SensitiveDataUser,
} from '@wepublish/website/api';
import {
  AuthTokenStorageKey,
  SessionTokenContext,
} from '@wepublish/authentication/website';
import { useMeLazyQuery } from '@wepublish/website/api';
import {
  memo,
  PropsWithChildren,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

export const AsyncSessionProvider = memo<
  PropsWithChildren<{ sessionToken: SessionWithTokenWithoutUser | null }>
>(function SessionProvider({ sessionToken, children }) {
  const [token, setToken] = useState<typeof sessionToken>();
  const [user, setUser] = useState<SensitiveDataUser | null>();
  const initialSetupDone = useRef(false);

  const [getMe] = useMeLazyQuery({
    onCompleted(data) {
      setUser((data.me as SensitiveDataUser) ?? null);
    },
  });

  const setCookieAndToken = useCallback(
    async (newToken: SessionWithTokenWithoutUser | null) => {
      setToken(newToken);
      setUser(undefined);

      if (newToken) {
        sessionStorage.setItem(AuthTokenStorageKey, JSON.stringify(newToken));
        await fetch('/api/cookie', {
          method: 'POST',
          body: JSON.stringify(newToken),
          headers: {
            'Content-Type': 'application/json',
          },
        });
        await getMe();
      } else {
        sessionStorage.removeItem(AuthTokenStorageKey);
        setUser(null);
        await fetch('/api/cookie', {
          method: 'DELETE',
        });
      }
    },
    [getMe]
  );

  const setupInitialSessionToken = useCallback(async () => {
    if (sessionToken) {
      setCookieAndToken(sessionToken);
      return;
    }

    const res = await fetch('/api/cookie', {
      method: 'GET',
    });
    const { sessionToken: token } = await (res.json() as Promise<{
      sessionToken: SessionWithTokenWithoutUser;
    }>);
    setToken(token);

    if (token) {
      sessionStorage.setItem(AuthTokenStorageKey, JSON.stringify(token));
      await getMe();
    } else {
      setUser(null);
    }
  }, [getMe, sessionToken, setCookieAndToken]);

  useEffect(() => {
    if (!initialSetupDone.current) {
      setupInitialSessionToken();
    }

    initialSetupDone.current = true;
  }, [setupInitialSessionToken]);

  return (
    <SessionTokenContext.Provider value={[user, !!token, setCookieAndToken]}>
      {children}
    </SessionTokenContext.Provider>
  );
});
