import { act, screen } from '@testing-library/react';
import { SessionTokenContext } from '@wepublish/authentication/website';
import {
  mockOperation,
  mockSensitiveDataUser,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { actWait } from '@wepublish/testing';
import { ConfirmEmailChangeDocument } from '@wepublish/website/api';
import de from '@wepublish/website/translations/de.json';
import { createConfirmEmailPage } from './confirm-email-page';

const { cookie } = vi.hoisted(() => ({
  cookie: { value: undefined as string | undefined },
}));

vi.mock('cookies-next', async importOriginal => ({
  ...(await importOriginal<typeof import('cookies-next')>()),
  getCookie: () => cookie.value,
}));

const confirmed = mockOperation(ConfirmEmailChangeDocument, {
  variables: { token: 'confirm-token' },
  data: {
    __typename: 'Mutation',
    confirmEmailChange: mockSensitiveDataUser(),
  },
});

const renderPage = async (
  confirmation = confirmed,
  refreshUser?: () => Promise<void>
) => {
  const ConfirmEmailPage = createConfirmEmailPage({
    redirectTo: '/welcome?emailConfirmed=1',
  });
  const page = <ConfirmEmailPage token="confirm-token" />;

  const rendered = renderWithProviders(
    refreshUser ?
      <SessionTokenContext.Provider
        value={[null, true, async () => undefined, refreshUser]}
      >
        {page}
      </SessionTokenContext.Provider>
    : page,
    {
      mocks: [confirmation],
      router: { pathname: '/confirm-email', query: { token: 'confirm-token' } },
    }
  );
  await act(() => actWait());

  return rendered;
};

describe('ConfirmEmailPage', () => {
  beforeEach(() => {
    cookie.value = undefined;
  });

  // The link comes from a mail program, a cross-site visit that doesn't carry
  // the strict session cookie to the server; only the browser can tell the
  // API which session to keep.
  // The mock answers one request; a second one fails the test as unmocked.
  it('confirms from the browser, once', async () => {
    await renderPage();

    expect(screen.getByText(de.user.emailConfirmed)).toBeTruthy();
  });

  it('goes straight on for a reader who is logged in', async () => {
    cookie.value = JSON.stringify({ token: 'session' });

    const { router } = await renderPage();

    expect(router.replace).toHaveBeenCalledWith('/welcome?emailConfirmed=1');
  });

  // The profile shows the user the session provider fetched when the page was
  // opened, which still carries the old address and the pending change.
  it('fetches the reader again before going on, so the profile shows the new address', async () => {
    cookie.value = JSON.stringify({ token: 'session' });
    const refreshUser = vi.fn(async () => undefined);

    const { router } = await renderPage(confirmed, refreshUser);

    // The page also rewrites its own url once to drop the token.
    const redirect = router.replace.mock.invocationCallOrder.at(-1)!;
    expect(router.replace).toHaveBeenLastCalledWith(
      '/welcome?emailConfirmed=1'
    );
    expect(refreshUser.mock.invocationCallOrder[0]).toBeLessThan(redirect);
  });

  it('says the address is confirmed, whether it changed or not, and offers to log in', async () => {
    const { router } = await renderPage();

    expect(screen.getByText(de.user.emailConfirmed)).toBeTruthy();
    expect(
      screen.getByRole('link', { name: de.user.emailConfirmedLogin })
    ).toBeTruthy();
    expect(router.replace).not.toHaveBeenCalledWith(
      '/welcome?emailConfirmed=1'
    );
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
