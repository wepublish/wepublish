import { MockedProvider } from '@apollo/client/testing';
import { act, render, waitFor } from '@testing-library/react';
import {
  AuthTokenStorageKey,
  SessionTokenContext,
} from '@wepublish/authentication/website';
import {
  MeDocument,
  SessionWithTokenWithoutUser,
} from '@wepublish/website/api';
import { deleteCookie } from 'cookies-next';
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

const meMock = {
  request: { query: MeDocument },
  result: { data: { me: null } },
  maxUsageCount: Number.POSITIVE_INFINITY,
};

const renderProvider = () =>
  render(
    <MockedProvider mocks={[meMock]}>
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
});
