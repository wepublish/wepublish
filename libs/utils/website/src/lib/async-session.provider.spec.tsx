import { MockedResponse } from '@apollo/client/testing';
import { MockedProvider } from '@apollo/client/testing/react';
import { render, waitFor } from '@testing-library/react';
import { SessionTokenContext } from '@wepublish/authentication/website';
import { mockSensitiveDataUser } from '@wepublish/mocks/website';
import {
  MeDocument,
  SessionWithTokenWithoutUser,
} from '@wepublish/website/api';
import { ContextType, useContext } from 'react';

import { AsyncSessionProvider } from './async-session.provider';

const session: SessionWithTokenWithoutUser = {
  token: 'session-token',
  expiresAt: new Date('2030-01-01').toISOString(),
  createdAt: new Date('2026-01-01').toISOString(),
};

let context: ContextType<typeof SessionTokenContext>;

const Consumer = () => {
  context = useContext(SessionTokenContext);

  return null;
};

const meResult = (me: unknown): MockedResponse => ({
  request: { query: MeDocument },
  result: { data: { me } },
  maxUsageCount: Number.POSITIVE_INFINITY,
});

const renderProvider = (mocks: MockedResponse[]) =>
  render(
    <MockedProvider mocks={mocks}>
      <AsyncSessionProvider sessionToken={null}>
        <Consumer />
      </AsyncSessionProvider>
    </MockedProvider>
  );

const cookieRequests = (fetchMock: ReturnType<typeof vi.fn>) =>
  fetchMock.mock.calls.map(([, init]) => init?.method);

describe('AsyncSessionProvider', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn(async () => ({
      json: async () => ({ sessionToken: session }),
    }));
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    sessionStorage.clear();
  });

  it('keeps a session the api accepts', async () => {
    renderProvider([meResult(mockSensitiveDataUser())]);

    await waitFor(() => expect(context?.[0]).toBeTruthy());
    expect(context?.[1]).toBe(true);
    expect(cookieRequests(fetchMock)).not.toContain('DELETE');
  });

  it('drops a session the api no longer accepts', async () => {
    renderProvider([meResult(null)]);

    await waitFor(() => expect(cookieRequests(fetchMock)).toContain('DELETE'));
    expect(context?.[1]).toBe(false);
  });

  it('keeps the session when the user could not be fetched', async () => {
    renderProvider([
      {
        request: { query: MeDocument },
        error: new Error('Network down'),
        maxUsageCount: Number.POSITIVE_INFINITY,
      },
    ]);

    await waitFor(() => expect(context?.[1]).toBe(true));
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(context?.[1]).toBe(true);
    expect(cookieRequests(fetchMock)).not.toContain('DELETE');
  });
});
