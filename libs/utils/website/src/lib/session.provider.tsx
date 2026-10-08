import { useLazyQuery } from '@apollo/client/react';
import {
  FullSensitiveDataUserFragment,
  FullSessionWithTokenWithoutUserFragment,
  MeDocument,
} from '@wepublish/website/api';
import {
  AuthTokenStorageKey,
  isFramed,
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
    try {
      const { data } = await getMe();
      setUser((data?.me as FullSensitiveDataUserFragment) ?? null);
    } catch {
      setUser(null);
    }
  }, [getMe]);

  const setCookieAndToken = useCallback(
    async (newToken: FullSessionWithTokenWithoutUserFragment | null) => {
      setToken(newToken);

      if (newToken) {
        // Browsers drop this SameSite=strict cookie inside a cross-site frame
        // (the editor's preview), so a framed page keeps a per-tab copy that
        // authLink falls back to. Top-level pages stay cookie-only, so a logout
        // in one tab still ends the session in all of them.
        if (isFramed()) {
          sessionStorage.setItem(AuthTokenStorageKey, JSON.stringify(newToken));
        }

        await setCookie(AuthTokenStorageKey, JSON.stringify(newToken), {
          expires: new Date(newToken.expiresAt),
          sameSite: 'strict',
          secure: process.env.NODE_ENV === 'production',
        });
        fetchMe();
      } else {
        setUser(null);
        sessionStorage.removeItem(AuthTokenStorageKey);
        deleteCookie(AuthTokenStorageKey);
      }
    },
    [fetchMe]
  );

  useEffect(() => {
    const stored =
      getCookie(AuthTokenStorageKey)?.toString() ??
      (isFramed() ? sessionStorage.getItem(AuthTokenStorageKey) : null);
    const sToken =
      sessionToken ? sessionToken
      : stored ? (JSON.parse(stored) as FullSessionWithTokenWithoutUserFragment)
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
