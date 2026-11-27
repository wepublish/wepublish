import { ApolloClient, InMemoryCache } from '@apollo/client';
import { deleteCookie } from '@tanstack/react-start/server';
import { AuthTokenStorageKey } from '@wepublish/authentication/website';
import { mockSensitiveDataUser } from '@wepublish/mocks/website';
import {
  FullSessionWithTokenWithoutUserFragment,
  MeDocument,
} from '@wepublish/website/api';

import { getPublicEnv, withAcceptedSession } from './ssr';

vi.mock('@tanstack/react-start/server', () => ({
  deleteCookie: vi.fn(),
  getCookie: vi.fn(),
  getRequestHeader: vi.fn(() => 'example.ch'),
  setCookie: vi.fn(),
  setResponseHeader: vi.fn(),
}));

describe('getPublicEnv', () => {
  const env = process.env;

  beforeEach(() => {
    process.env = { ...env };
  });

  afterEach(() => {
    process.env = env;
  });

  it('ships the stripe publishable key to the browser', () => {
    process.env.STRIPE_PUBLIC_KEY = 'pk_test_123';

    expect(getPublicEnv().STRIPE_PUBLIC_KEY).toBe('pk_test_123');
  });

  it('never ships the in-cluster api url', () => {
    process.env.API_URL = 'https://api.example.ch';
    process.env.API_URL_INTERNAL = 'http://api.svc.cluster.local';

    expect(JSON.stringify(getPublicEnv())).not.toContain('cluster.local');
  });
});

describe('withAcceptedSession', () => {
  const session: FullSessionWithTokenWithoutUserFragment = {
    __typename: 'SessionWithTokenWithoutUser',
    token: 'session-token',
    expiresAt: new Date('2030-01-01').toISOString(),
    createdAt: new Date('2026-01-01').toISOString(),
  };

  const clientWithMe = (me: unknown) => {
    const client = new ApolloClient({
      cache: new InMemoryCache(),
      link: { request: () => null } as never,
    });
    client.writeQuery({ query: MeDocument, data: { me } as never });

    return client;
  };

  beforeEach(() => {
    vi.mocked(deleteCookie).mockClear();
  });

  it('keeps a session the api accepts', () => {
    const client = clientWithMe(mockSensitiveDataUser());

    expect(withAcceptedSession(client, session)).toBe(session);
    expect(deleteCookie).not.toHaveBeenCalled();
  });

  it('drops a session the api no longer accepts, cookie included', () => {
    const client = clientWithMe(null);

    expect(withAcceptedSession(client, session)).toBeNull();
    expect(deleteCookie).toHaveBeenCalledWith(
      AuthTokenStorageKey,
      expect.objectContaining({ path: '/' })
    );
  });

  it('keeps the session when the user was not fetched', () => {
    const client = new ApolloClient({
      cache: new InMemoryCache(),
      link: { request: () => null } as never,
    });

    expect(withAcceptedSession(client, session)).toBe(session);
    expect(deleteCookie).not.toHaveBeenCalled();
  });

  it('passes on no session', () => {
    expect(withAcceptedSession(clientWithMe(null), null)).toBeNull();
    expect(deleteCookie).not.toHaveBeenCalled();
  });
});
