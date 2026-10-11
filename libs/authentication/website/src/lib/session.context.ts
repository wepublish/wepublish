import { useApolloClient } from '@apollo/client/react';
import {
  FullSensitiveDataUserFragment,
  FullSessionWithTokenWithoutUserFragment,
} from '@wepublish/website/api';
import { createContext, useContext } from 'react';

export const AuthTokenStorageKey = 'auth.token';

export const SessionTokenContext = createContext<
  | [
      FullSensitiveDataUserFragment | null | undefined,
      boolean,
      (value: FullSessionWithTokenWithoutUserFragment | null) => Promise<void>,
    ]
  | null
>(null);

const useSessionContext = () => {
  const context = useContext(SessionTokenContext);

  if (!context) {
    throw new Error('SessionTokenContext has not been provided.');
  }

  return context;
};

export const useUser = () => {
  const client = useApolloClient();
  const [user, hasUser, setToken] = useSessionContext();

  const logout = async () => {
    await setToken(null);
    // Refreshes the page's data for the logged-out visitor. A query still
    // running for the user who just left is cancelled or refused, which does
    // not undo the logout.
    await client.resetStore().catch(() => undefined);
  };

  return { user, hasUser, setToken, logout };
};
