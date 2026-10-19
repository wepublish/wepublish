import { composeStory } from '@storybook/react';
import { act, cleanup, render, screen } from '@testing-library/react';
import * as config from '@wepublish/storybook';
import { SessionTokenContext } from '@wepublish/authentication/website';
import { actWait } from '@wepublish/testing';
import de from '@wepublish/website/translations/de.json';
import { createConfirmEmailPage } from './confirm-email-page';

const { confirm, replace, cookie } = vi.hoisted(() => ({
  confirm: vi.fn(),
  replace: vi.fn(),
  cookie: { value: undefined as string | undefined },
}));

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useMutation: () => [confirm, { loading: false }],
}));

vi.mock('next/router', () => ({
  useRouter: () => ({
    query: { token: 'confirm-token' },
    pathname: '/confirm-email',
    replace,
  }),
}));

vi.mock('cookies-next', async importOriginal => ({
  ...(await importOriginal<typeof import('cookies-next')>()),
  getCookie: () => cookie.value,
}));

const renderPage = async (refreshUser?: () => Promise<void>) => {
  const ConfirmEmailPage = createConfirmEmailPage({
    redirectTo: '/welcome?emailConfirmed=1',
  });
  const Story = composeStory(
    {
      render: () =>
        refreshUser ?
          <SessionTokenContext.Provider
            value={[null, true, async () => undefined, refreshUser]}
          >
            <ConfirmEmailPage token="confirm-token" />
          </SessionTokenContext.Provider>
        : <ConfirmEmailPage token="confirm-token" />,
    },
    { title: 'Confirm email page' },
    config
  );

  render(<Story />);
  await act(() => actWait());
};

describe('ConfirmEmailPage', () => {
  beforeEach(() => {
    confirm.mockReset();
    replace.mockReset();
    cookie.value = undefined;
  });
  afterEach(cleanup);

  // The link comes from a mail program, a cross-site visit that doesn't carry
  // the strict session cookie to the server; only the browser can tell the
  // API which session to keep.
  it('confirms from the browser, once', async () => {
    confirm.mockResolvedValue({ data: { confirmEmailChange: { id: 'u1' } } });

    await renderPage();

    expect(confirm).toHaveBeenCalledTimes(1);
    expect(confirm).toHaveBeenCalledWith({
      variables: { token: 'confirm-token' },
    });
  });

  it('goes straight on for a reader who is logged in', async () => {
    cookie.value = JSON.stringify({ token: 'session' });
    confirm.mockResolvedValue({ data: { confirmEmailChange: { id: 'u1' } } });

    await renderPage();

    expect(replace).toHaveBeenCalledWith('/welcome?emailConfirmed=1');
  });

  // The profile shows the user the session provider fetched when the page was
  // opened, which still carries the old address and the pending change.
  it('fetches the reader again before going on, so the profile shows the new address', async () => {
    cookie.value = JSON.stringify({ token: 'session' });
    confirm.mockResolvedValue({ data: { confirmEmailChange: { id: 'u1' } } });
    const order: string[] = [];
    const refreshUser = vi.fn(async () => {
      order.push('refresh');
    });
    // The page also rewrites its own url once to drop the token.
    replace.mockImplementation((to: unknown) => {
      if (to === '/welcome?emailConfirmed=1') {
        order.push('replace');
      }
    });

    await renderPage(refreshUser);

    expect(order).toEqual(['refresh', 'replace']);
  });

  it('says the address is confirmed, whether it changed or not, and offers to log in', async () => {
    confirm.mockResolvedValue({ data: { confirmEmailChange: { id: 'u1' } } });

    await renderPage();

    expect(screen.getByText(de.user.emailConfirmed)).toBeTruthy();
    expect(
      screen.getByRole('link', { name: de.user.emailConfirmedLogin })
    ).toBeTruthy();
    expect(replace).not.toHaveBeenCalledWith('/welcome?emailConfirmed=1');
  });

  it('shows why a link did not work', async () => {
    confirm.mockResolvedValue({
      error: new Error('Invalid or expired confirmation link.'),
    });

    await renderPage();

    expect(
      screen.getByText('Invalid or expired confirmation link.')
    ).toBeTruthy();
  });
});
