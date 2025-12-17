import {
  SessionWithTokenWithoutUser,
  SensitiveDataUser,
} from '@wepublish/website/api';
import {
  AuthTokenStorageKey,
  SessionTokenContext,
} from '@wepublish/authentication/website';
import { useMeLazyQuery } from '@wepublish/website/api';
import { deleteCookie, getCookie, setCookie } from 'cookies-next';
import {
  memo,
  PropsWithChildren,
  useCallback,
  useEffect,
  useState,
} from 'react';

export const SessionProvider = memo<
  PropsWithChildren<{ sessionToken: SessionWithTokenWithoutUser | null }>
>(function SessionProvider({ sessionToken, children }) {
  const [token, setToken] = useState<typeof sessionToken>(sessionToken);
  const [user, setUser] = useState<SensitiveDataUser | null>(null);

  const [getMe] = useMeLazyQuery({
    onCompleted(data) {
      setUser((data.me as SensitiveDataUser) ?? null);
    },
  });

  const setCookieAndToken = useCallback(
    async (newToken: SessionWithTokenWithoutUser | null) => {
      setToken(newToken);

      if (newToken) {
        await setCookie(AuthTokenStorageKey, JSON.stringify(newToken), {
          expires: new Date(newToken.expiresAt),
          sameSite: 'strict',
          secure: process.env.NODE_ENV === 'production',
        });
        getMe();
      } else {
        setUser(null);
        deleteCookie(AuthTokenStorageKey);
      }
    },
    [getMe]
  );

  useEffect(() => {
    const cookie = getCookie(AuthTokenStorageKey);
    const sToken =
      sessionToken ? sessionToken
      : cookie ? (JSON.parse(cookie.toString()) as SessionWithTokenWithoutUser)
      : null;

    if (sToken) {
      setCookieAndToken(sToken);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SessionTokenContext.Provider value={[user, !!token, setCookieAndToken]}>
      {children}
    </SessionTokenContext.Provider>
  );
});
