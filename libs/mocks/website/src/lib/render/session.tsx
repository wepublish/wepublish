import { SessionTokenContext } from '@wepublish/authentication/website';
import { mockSensitiveDataUser } from '../user';
import {
  FullSensitiveDataUserFragment,
  FullSessionWithTokenWithoutUserFragment,
} from '@wepublish/website/api';
import { PropsWithChildren, useState } from 'react';
import { Mock, vi } from 'vitest';

export type SetToken = (
  token: FullSessionWithTokenWithoutUserFragment | null
) => Promise<void>;

export const createSetToken = (): Mock<SetToken> =>
  vi.fn<SetToken>(async () => undefined);

type TestSessionProviderProps = PropsWithChildren<{
  user: FullSensitiveDataUserFragment | null;
  setToken: Mock<SetToken>;
}>;

export const TestSessionProvider = ({
  user: initialUser,
  setToken,
  children,
}: TestSessionProviderProps) => {
  const [user, setUser] = useState(initialUser);

  const updateToken: SetToken = async token => {
    await setToken(token);
    setUser(token ? (initialUser ?? mockSensitiveDataUser()) : null);
  };

  return (
    <SessionTokenContext.Provider value={[user, !!user, updateToken]}>
      {children}
    </SessionTokenContext.Provider>
  );
};
