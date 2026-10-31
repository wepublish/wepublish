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
      /**
       * Fetches the user again. For pages that change the user on the API
       * and go on to a page that reads them from this context.
       */
      (() => Promise<void>)?,
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

const noRefresh = async () => undefined;

export const useUser = () => {
  const client = useApolloClient();
  const [user, hasUser, setToken, refreshUser = noRefresh] =
    useSessionContext();

  const logout = async () => {
    await setToken(null);
    // Refreshes the page's data for the logged-out visitor. A query still
    // running for the user who just left is cancelled or refused, which does
    // not undo the logout.
    await client.resetStore().catch(() => undefined);
  };

  return { user, hasUser, setToken, refreshUser, logout };
};
