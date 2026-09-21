import { useApolloClient } from '@apollo/client';
import {
  SensitiveDataUser,
  SessionWithTokenWithoutUser,
} from '@wepublish/website/api';
import { createContext, useContext } from 'react';

export const AuthTokenStorageKey = 'auth.token';

export const SessionTokenContext = createContext<
  | [
      SensitiveDataUser | null | undefined,
      boolean,
      (value: SessionWithTokenWithoutUser | null) => Promise<void>,
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
    await client.resetStore();
  };

  return { user, hasUser, setToken, logout };
};
