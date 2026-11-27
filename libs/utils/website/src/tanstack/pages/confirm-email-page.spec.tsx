import { act, screen } from '@testing-library/react';
import { SessionTokenContext } from '@wepublish/authentication/website';
import {
  mockOperation,
  mockSensitiveDataUser,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { actWait } from '@wepublish/testing';
import {
  ConfirmEmailChangeDocument,
  SessionInfoDocument,
  SessionOrigin,
} from '@wepublish/website/api';
import de from '@wepublish/website/translations/de.json';

import { createConfirmEmailPage } from './confirm-email-page';

const { cookie, navigate, replaceSearch } = vi.hoisted(() => ({
  cookie: { value: undefined as string | undefined },
  navigate: vi.fn(),
  replaceSearch: vi.fn(),
}));

vi.mock('cookies-next', async importOriginal => ({
  ...(await importOriginal<typeof import('cookies-next')>()),
  getCookie: () => cookie.value,
}));

vi.mock('@tanstack/react-router', async importOriginal => ({
  ...(await importOriginal<object>()),
  useNavigate: () => navigate,
}));

vi.mock('../router-hooks', async importOriginal => ({
  ...(await importOriginal<object>()),
  useQueryParams: () => ({ token: 'confirm-token' }),
  useReplaceSearch: () => replaceSearch,
}));

const confirmed = mockOperation(ConfirmEmailChangeDocument, {
  variables: { token: 'confirm-token' },
  data: {
    __typename: 'Mutation',
    confirmEmailChange: mockSensitiveDataUser(),
  },
});

// What the browser's own session is after the confirmation.
const sessionStillOpen = mockOperation(SessionInfoDocument, {
  data: {
    __typename: 'Query',
    sessionInfo: {
      __typename: 'SessionInfo',
      origin: SessionOrigin.Purl,
      restricted: false,
      placeholderEmail: false,
      secondFactor: null,
      canReplaceEmail: false,
      createdAt: '2026-01-01T00:00:00.000Z',
      expiresAt: '2030-01-01T00:00:00.000Z',
    },
  },
});
const sessionEnded = mockOperation(SessionInfoDocument, {
  errors: [{ message: 'User authentication failed' }],
});

const renderPage = async (
  confirmation = confirmed,
  refreshUser?: () => Promise<void>,
  session: typeof sessionStillOpen | undefined = undefined
) => {
  const ConfirmEmailPage = createConfirmEmailPage({
    redirectTo: '/welcome?emailConfirmed=1',
  });
  const page = <ConfirmEmailPage />;

  const rendered = renderWithProviders(
    refreshUser ?
      <SessionTokenContext.Provider
        value={[null, true, async () => undefined, refreshUser]}
      >
        {page}
      </SessionTokenContext.Provider>
    : page,
    { mocks: session ? [confirmation, session] : [confirmation] }
  );
  // The confirmation, then the look at the session, then the refresh.
  await act(() => actWait());
  await act(() => actWait());
  await act(() => actWait());

  return rendered;
};

describe('ConfirmEmailPage (TanStack)', () => {
  beforeEach(() => {
    cookie.value = undefined;
    navigate.mockReset();
    replaceSearch.mockReset();
  });

  // The link comes from a mail program, a cross-site visit that doesn't carry
  // the strict session cookie to the server; only the browser can tell the
  // API which session to keep.
  // The mock answers one request; a second one fails the test as unmocked.
  it('confirms from the browser, once', async () => {
    await renderPage();

    expect(screen.getByText(de.user.emailConfirmed)).toBeTruthy();
  });

  it('drops the token from the address bar', async () => {
    await renderPage();

    expect(replaceSearch).toHaveBeenCalledTimes(1);
    const updater = replaceSearch.mock.calls[0][0];
    expect(updater({ token: 'confirm-token', utm: 'mail' })).toEqual({
      utm: 'mail',
    });
  });

  it('keeps the token out of the referrer of everything the page loads', async () => {
    await renderPage();

    expect(
      document.querySelector('meta[name="referrer"][content="no-referrer"]')
    ).not.toBeNull();
  });

  // The profile shows the user the session provider fetched when the page was
  // opened, which still carries the old address and the pending change.
  it('fetches a logged-in reader again, then goes straight on', async () => {
    cookie.value = JSON.stringify({ token: 'session' });
    const refreshUser = vi.fn(async () => undefined);

    await renderPage(confirmed, refreshUser, sessionStillOpen);

    expect(navigate).toHaveBeenCalledWith({
      href: '/welcome?emailConfirmed=1',
      replace: true,
    });
    expect(refreshUser.mock.invocationCallOrder[0]).toBeLessThan(
      navigate.mock.invocationCallOrder[0]
    );
  });

  it('says the address is confirmed, whether it changed or not, and offers to log in', async () => {
    await renderPage();

    expect(screen.getByText(de.user.emailConfirmed)).toBeTruthy();
    expect(
      screen.getByRole('link', { name: de.user.emailConfirmedLogin })
    ).toBeTruthy();
    expect(navigate).not.toHaveBeenCalled();
  });

  // Only the session that asked for the confirmation is freed by it. Any
  // other login-code session of the account ends, this browser's included:
  // the page must not carry on with a session that is gone.
  it('logs the browser out when its session did not survive the confirmation', async () => {
    cookie.value = JSON.stringify({ token: 'session' });

    const { setToken } = await renderPage(confirmed, undefined, sessionEnded);

    expect(setToken).toHaveBeenCalledWith(null);
    expect(screen.getByText(de.user.emailConfirmedSignedOut)).toBeTruthy();
    expect(
      screen.getByRole('link', { name: de.user.emailConfirmedLogin })
    ).toBeTruthy();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('shows why a link did not work', async () => {
    await renderPage(
      mockOperation(ConfirmEmailChangeDocument, {
        variables: { token: 'confirm-token' },
        errors: [{ message: 'Invalid or expired confirmation link.' }],
      })
    );

    expect(
      screen.getByText('Invalid or expired confirmation link.')
    ).toBeTruthy();
  });
});
