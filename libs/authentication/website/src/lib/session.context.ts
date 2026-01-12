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
  const [user, hasUser, setToken] = useSessionContext();

  const logout = async () => {
    setToken(null);
  };

  return { user, hasUser, setToken, logout };
};
