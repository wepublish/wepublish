import { ApolloClient, ApolloProvider, InMemoryCache } from '@apollo/client';
import { act, renderHook } from '@testing-library/react';
import { PropsWithChildren } from 'react';

import { SessionTokenContext, useUser } from './session.context';

describe('useUser', () => {
  const client = new ApolloClient({ cache: new InMemoryCache() });
  const setToken = vi.fn().mockResolvedValue(undefined);

  const wrapper = ({ children }: PropsWithChildren) => (
    <ApolloProvider client={client}>
      <SessionTokenContext.Provider value={[null, true, setToken]}>
        {children}
      </SessionTokenContext.Provider>
    </ApolloProvider>
  );

  afterEach(() => {
    vi.restoreAllMocks();
    setToken.mockClear();
  });

  it('clears the session and resets the apollo store on logout', async () => {
    const resetStore = vi
      .spyOn(client, 'resetStore')
      .mockResolvedValue([] as never);

    const { result } = renderHook(() => useUser(), { wrapper });

    await act(() => result.current.logout());

    expect(setToken).toHaveBeenCalledWith(null);
    expect(resetStore).toHaveBeenCalled();
    expect(setToken.mock.invocationCallOrder[0]).toBeLessThan(
      resetStore.mock.invocationCallOrder[0]
    );
  });
});
