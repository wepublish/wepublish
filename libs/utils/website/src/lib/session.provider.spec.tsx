import { MockedProvider } from '@apollo/client/testing/react';
import { MockedResponse } from '@apollo/client/testing';
import { act, render, waitFor } from '@testing-library/react';
import {
  AuthTokenStorageKey,
  SessionTokenContext,
} from '@wepublish/authentication/website';
import { mockSensitiveDataUser } from '@wepublish/mocks/website';
import {
  MeDocument,
  SessionWithTokenWithoutUser,
} from '@wepublish/website/api';
import { deleteCookie, getCookie } from 'cookies-next';
import { ContextType, useContext } from 'react';

import { SessionProvider } from './session.provider';

const session: SessionWithTokenWithoutUser = {
  token: 'session-token',
  expiresAt: new Date('2030-01-01').toISOString(),
  createdAt: new Date('2026-01-01').toISOString(),
};

const setParent = (parent: unknown) => {
  Object.defineProperty(window, 'parent', {
    value: parent,
    configurable: true,
    writable: true,
  });
};

let context: ContextType<typeof SessionTokenContext>;

const Consumer = () => {
  context = useContext(SessionTokenContext);

  return null;
};

const meRequests = { count: 0 };

const meMock: MockedResponse = {
  request: { query: MeDocument },
  result: () => {
    meRequests.count += 1;

    return { data: { me: mockSensitiveDataUser() } };
  },
  maxUsageCount: Number.POSITIVE_INFINITY,
};

const renderProvider = (mocks: MockedResponse[] = [meMock]) =>
  render(
    <MockedProvider mocks={mocks}>
      <SessionProvider sessionToken={null}>
        <Consumer />
      </SessionProvider>
    </MockedProvider>
  );

const setToken = (token: SessionWithTokenWithoutUser | null) =>
  act(async () => {
    await context?.[2](token);
  });

describe('SessionProvider', () => {
  afterEach(() => {
    setParent(window);
    sessionStorage.clear();
    deleteCookie(AuthTokenStorageKey);
    meRequests.count = 0;
  });

  // The user is fetched once when the session is set. A page that changes the
  // user on the API, such as the one confirming a new address, asks for it
  // again through the context instead of waiting for a full reload.
  it('fetches the user again on request', async () => {
    renderProvider();
    await setToken(session);
    await waitFor(() => expect(meRequests.count).toBe(1));

    await act(async () => {
      await context?.[3]?.();
    });

    await waitFor(() => expect(meRequests.count).toBe(2));
  });

  describe('inside a cross-site frame (editor preview)', () => {
    beforeEach(() => {
      setParent({});
    });

    it('keeps the session in sessionStorage, where the frame can still read it', async () => {
      renderProvider();
      await setToken(session);

      expect(sessionStorage.getItem(AuthTokenStorageKey)).toBe(
        JSON.stringify(session)
      );
    });

    it('removes the frame session copy on logout', async () => {
      renderProvider();
      await setToken(session);
      await setToken(null);

      expect(sessionStorage.getItem(AuthTokenStorageKey)).toBeNull();
    });

    it('restores the session from sessionStorage when no cookie is readable', async () => {
      sessionStorage.setItem(AuthTokenStorageKey, JSON.stringify(session));

      renderProvider();

      await waitFor(() => expect(context?.[1]).toBe(true));
    });
  });

  describe('as a top-level page', () => {
    it('keeps the session in the cookie only', async () => {
      renderProvider();
      await setToken(session);

      expect(sessionStorage.getItem(AuthTokenStorageKey)).toBeNull();
    });

    it('ignores a session left in sessionStorage', async () => {
      sessionStorage.setItem(AuthTokenStorageKey, JSON.stringify(session));

      renderProvider();
      await act(async () => undefined);

      expect(context?.[1]).toBe(false);
    });
  });

  describe('with a session the api no longer accepts', () => {
    it('drops the session, so the reader counts as logged out', async () => {
      renderProvider([
        {
          request: { query: MeDocument },
          result: { data: { me: null } },
          maxUsageCount: Number.POSITIVE_INFINITY,
        },
      ]);
      await setToken(session);

      await waitFor(() => expect(context?.[1]).toBe(false));
      expect(getCookie(AuthTokenStorageKey)).toBeUndefined();
    });

    it('keeps the session when the user could not be fetched', async () => {
      renderProvider([
        {
          request: { query: MeDocument },
          error: new Error('Network down'),
          maxUsageCount: Number.POSITIVE_INFINITY,
        },
      ]);
      await setToken(session);
      await act(async () => undefined);

      expect(context?.[1]).toBe(true);
      expect(getCookie(AuthTokenStorageKey)).toBe(JSON.stringify(session));
    });
  });
});
