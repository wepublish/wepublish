// @vitest-environment node
import { ApolloClient, InMemoryCache } from '@apollo/client';
import { AuthTokenStorageKey } from '@wepublish/authentication/website';
import { mockSensitiveDataUser } from '@wepublish/mocks/website';
import {
  FullSessionWithTokenWithoutUserFragment,
  MeDocument,
} from '@wepublish/website/api';
import { deleteCookie } from 'cookies-next';
import { NextPageContext } from 'next';

import { withAcceptedSessionProps } from './get-session-token-props';

vi.mock('cookies-next', async importOriginal => ({
  ...(await importOriginal<object>()),
  deleteCookie: vi.fn(),
}));

const session: FullSessionWithTokenWithoutUserFragment = {
  __typename: 'SessionWithTokenWithoutUser',
  token: 'session-token',
  expiresAt: new Date('2030-01-01').toISOString(),
  createdAt: new Date('2026-01-01').toISOString(),
};

const ctx = { req: {}, res: {} } as unknown as NextPageContext;

const client = () =>
  new ApolloClient({
    cache: new InMemoryCache(),
    link: { request: () => null } as never,
  });

const clientWithMe = (me: unknown) => {
  const withMe = client();
  withMe.writeQuery({ query: MeDocument, data: { me } as never });

  return withMe;
};

describe('withAcceptedSessionProps', () => {
  beforeEach(() => {
    vi.mocked(deleteCookie).mockClear();
  });

  it('keeps a session the api accepts', () => {
    expect(
      withAcceptedSessionProps(ctx, clientWithMe(mockSensitiveDataUser()), {
        sessionToken: session,
      })
    ).toEqual({ sessionToken: session });
    expect(deleteCookie).not.toHaveBeenCalled();
  });

  it('drops a session the api no longer accepts, cookie included', () => {
    expect(
      withAcceptedSessionProps(ctx, clientWithMe(null), {
        sessionToken: session,
      })
    ).toEqual({ sessionToken: null });
    expect(deleteCookie).toHaveBeenCalledWith(AuthTokenStorageKey, {
      req: ctx.req,
      res: ctx.res,
    });
  });

  it('keeps the session when the user was not fetched', () => {
    expect(
      withAcceptedSessionProps(ctx, client(), { sessionToken: session })
    ).toEqual({ sessionToken: session });
    expect(deleteCookie).not.toHaveBeenCalled();
  });
});
