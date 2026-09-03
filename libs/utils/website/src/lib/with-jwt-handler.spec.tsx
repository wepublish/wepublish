import { MockedProvider, MockedResponse } from '@apollo/client/testing';
import { render, screen, waitFor } from '@testing-library/react';
import { SessionTokenContext } from '@wepublish/authentication/website';
import { LoginWithJwtDocument } from '@wepublish/website/api';
import { ComponentProps } from 'react';

import { withJwtHandler } from './with-jwt-handler';

const session = {
  __typename: 'SessionWithToken',
  token: 'session-token',
  expiresAt: new Date('2030-01-01').toISOString(),
  createdAt: new Date('2026-01-01').toISOString(),
};

const loginMock = (jwt: string): MockedResponse => ({
  request: {
    query: LoginWithJwtDocument,
    variables: { jwt },
  },
  result: {
    data: {
      createSessionWithJWT: session,
    },
  },
});

const Content = () => <div>content</div>;
const ControlledContent = withJwtHandler(Content);

type SessionContextValue = ComponentProps<
  typeof SessionTokenContext.Provider
>['value'];

const renderHandler = ({
  hasUser = false,
  mocks = [],
}: {
  hasUser?: boolean;
  mocks?: MockedResponse[];
} = {}) => {
  const setToken = vi.fn().mockResolvedValue(undefined);
  const contextValue = [null, hasUser, setToken] as SessionContextValue;

  const result = render(
    <MockedProvider mocks={mocks}>
      <SessionTokenContext.Provider value={contextValue}>
        <ControlledContent />
      </SessionTokenContext.Provider>
    </MockedProvider>
  );

  return { setToken, ...result };
};

const sendMessage = (source: unknown, data: unknown) => {
  const event = new MessageEvent('message', { data });
  Object.defineProperty(event, 'source', { value: source });
  window.dispatchEvent(event);
};

const setOpener = (opener: unknown) => {
  Object.defineProperty(window, 'opener', {
    value: opener,
    configurable: true,
    writable: true,
  });
};

describe('withJwtHandler', () => {
  afterEach(() => {
    setOpener(null);
    window.history.replaceState(null, '', '/');
  });

  it('renders the wrapped component', () => {
    renderHandler();

    expect(screen.getByText('content')).toBeDefined();
  });

  describe('opened from the editor (handshake)', () => {
    it('pings the opener with preview-jwt-ready until a token arrives', () => {
      vi.useFakeTimers();
      const opener = { postMessage: vi.fn() };
      setOpener(opener);

      renderHandler();
      vi.advanceTimersByTime(1_000);
      vi.useRealTimers();

      expect(opener.postMessage.mock.calls.length).toBeGreaterThanOrEqual(4);
      expect(opener.postMessage).toHaveBeenCalledWith('preview-jwt-ready', '*');
    });

    it('acknowledges a received token and logs in with it', async () => {
      const opener = { postMessage: vi.fn() };
      setOpener(opener);

      const { setToken } = renderHandler({
        mocks: [loginMock('preview-token')],
      });

      sendMessage(opener, { previewJwt: 'preview-token' });

      expect(opener.postMessage).toHaveBeenCalledWith(
        'preview-jwt-received',
        '*'
      );

      await waitFor(() => {
        expect(setToken).toHaveBeenCalledWith(
          expect.objectContaining({ token: 'session-token' })
        );
      });
    });

    it('logs in with the preview token even when a session already exists', async () => {
      const opener = { postMessage: vi.fn() };
      setOpener(opener);

      const { setToken } = renderHandler({
        hasUser: true,
        mocks: [loginMock('preview-token')],
      });

      sendMessage(opener, { previewJwt: 'preview-token' });

      await waitFor(() => {
        expect(setToken).toHaveBeenCalledWith(
          expect.objectContaining({ token: 'session-token' })
        );
      });
    });

    it('ignores tokens sent from windows other than the opener', async () => {
      const opener = { postMessage: vi.fn() };
      setOpener(opener);

      const { setToken } = renderHandler({
        mocks: [loginMock('preview-token')],
      });

      sendMessage({ some: 'other window' }, { previewJwt: 'preview-token' });

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(opener.postMessage).not.toHaveBeenCalledWith(
        'preview-jwt-received',
        '*'
      );
      expect(setToken).not.toHaveBeenCalled();
    });
  });

  describe('opened via a link with ?jwt=', () => {
    it('logs in with the jwt from the url and strips it from the url', async () => {
      window.history.replaceState(null, '', '/?jwt=url-token');

      const { setToken } = renderHandler({ mocks: [loginMock('url-token')] });

      await waitFor(() => {
        expect(setToken).toHaveBeenCalledWith(
          expect.objectContaining({ token: 'session-token' })
        );
      });

      expect(window.location.search).not.toContain('jwt=');
    });

    it('does not log in when a session already exists', async () => {
      window.history.replaceState(null, '', '/?jwt=url-token');

      const { setToken } = renderHandler({
        hasUser: true,
        mocks: [loginMock('url-token')],
      });

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(setToken).not.toHaveBeenCalled();
    });
  });
});
