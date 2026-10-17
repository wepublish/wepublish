import { MockedProvider } from '@apollo/client/testing/react';
import { act, cleanup, render } from '@testing-library/react';
import {
  SessionTokenContext,
  useUser,
} from '@wepublish/authentication/website';
import { actWait } from '@wepublish/testing';
import { CurrentSessionDocument } from '@wepublish/website/api';
import { GraphQLError } from 'graphql';
import { PropsWithChildren, useState } from 'react';
import { withRestrictedSessionRedirect } from './with-restricted-session-redirect';

vi.mock('next/router', () => ({
  useRouter: () => ({ pathname: '/', replace: vi.fn() }),
}));

const currentSession = {
  request: { query: CurrentSessionDocument },
  delay: 0,
  result: {
    data: {
      currentSession: {
        __typename: 'SessionInfo',
        origin: 'password',
        restricted: false,
        placeholderEmail: false,
        secondFactor: 'none',
        canReplaceEmail: false,
        createdAt: '2026-10-11T08:00:00.000Z',
        expiresAt: '2026-11-11T08:00:00.000Z',
      },
    },
  },
};

// Asked again while logging out; answers only after the user is gone.
const askedWhileLoggingOut = {
  request: { query: CurrentSessionDocument },
  delay: 50,
  result: { errors: [new GraphQLError('Unauthorized')] },
};

// Logging out takes the user away, like the website's session provider does.
const Session = ({ children }: PropsWithChildren) => {
  const [hasUser, setHasUser] = useState(true);

  return (
    <SessionTokenContext.Provider
      value={[
        hasUser ? ({ id: 'user-1' } as never) : null,
        hasUser,
        async token => setHasUser(!!token),
      ]}
    >
      {children}
    </SessionTokenContext.Provider>
  );
};

describe('withRestrictedSessionRedirect', () => {
  afterEach(cleanup);

  it('lets logging out finish while it is still asking for the session', async () => {
    let logout: (() => Promise<void>) | undefined;
    const Page = withRestrictedSessionRedirect()(() => {
      ({ logout } = useUser());

      return <p>page</p>;
    });

    render(
      <MockedProvider mocks={[currentSession, askedWhileLoggingOut]}>
        <Session>
          <Page />
        </Session>
      </MockedProvider>
    );
    await actWait();

    await act(async () => {
      await expect(logout!()).resolves.toBeUndefined();
    });
  });
});
