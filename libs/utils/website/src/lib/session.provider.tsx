import { useLazyQuery } from '@apollo/client/react';
import {
  FullSensitiveDataUserFragment,
  FullSessionWithTokenWithoutUserFragment,
  MeDocument,
} from '@wepublish/website/api';
import {
  AuthTokenStorageKey,
  SessionTokenContext,
} from '@wepublish/authentication/website';
import { deleteCookie, getCookie, setCookie } from 'cookies-next';
import {
  memo,
  PropsWithChildren,
  useCallback,
  useEffect,
  useState,
} from 'react';

export const SessionProvider = memo<
  PropsWithChildren<{
    sessionToken: FullSessionWithTokenWithoutUserFragment | null;
  }>
>(function SessionProvider({ sessionToken, children }) {
  const [token, setToken] = useState<typeof sessionToken>(sessionToken);
  const [user, setUser] = useState<FullSensitiveDataUserFragment | null>(null);

  const [getMe] = useLazyQuery(MeDocument, {
    fetchPolicy: 'network-only',
  });

  const fetchMe = useCallback(async () => {
    const { data } = await getMe();
    setUser((data?.me as FullSensitiveDataUserFragment) ?? null);
  }, [getMe]);

  const setCookieAndToken = useCallback(
    async (newToken: FullSessionWithTokenWithoutUserFragment | null) => {
      setToken(newToken);

      if (newToken) {
        await setCookie(AuthTokenStorageKey, JSON.stringify(newToken), {
          expires: new Date(newToken.expiresAt),
          sameSite: 'strict',
          secure: process.env.NODE_ENV === 'production',
        });
        fetchMe();
      } else {
        setUser(null);
        deleteCookie(AuthTokenStorageKey);
      }
    },
    [fetchMe]
  );

  useEffect(() => {
    const cookie = getCookie(AuthTokenStorageKey);
    const sToken =
      sessionToken ? sessionToken
      : cookie ?
        (JSON.parse(
          cookie.toString()
        ) as FullSessionWithTokenWithoutUserFragment)
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
