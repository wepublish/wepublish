import { act, fireEvent, screen } from '@testing-library/react';
import {
  anyVariables,
  mockOperation,
  mockSensitiveDataUser,
  mockSession,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { actWait } from '@wepublish/testing';
import { LoginWithCodeDocument } from '@wepublish/website/api';
import de from '@wepublish/website/translations/de.json';
import {
  createLoginCodePage,
  LoginCodeFailure,
  loginCodeFailure,
} from './login-code-page';

const CODE = 'ABCDE-FGHJK';

const redeemed = () =>
  mockOperation(LoginWithCodeDocument, {
    variables: anyVariables,
    data: {
      __typename: 'Mutation',
      createSessionWithLoginCode: mockSession({ token: 'session-token' }),
    },
  });

const refused = (message: string) =>
  mockOperation(LoginWithCodeDocument, {
    variables: anyVariables,
    errors: [{ message }],
  });

const renderPage = (
  mocks: ReturnType<typeof redeemed>[] = [],
  loggedIn = false
) => {
  const { Page } = createLoginCodePage();

  return renderWithProviders(<Page code={CODE} />, {
    mocks,
    user: loggedIn ? mockSensitiveDataUser() : null,
    router: { pathname: '/code/[code]', query: { code: CODE } },
  });
};

const logIn = async () => {
  act(() =>
    fireEvent.click(screen.getByRole('button', { name: de.login.code.submit }))
  );
  await act(() => actWait());
};

describe('loginCodeFailure', () => {
  it.each([
    ['LOGIN_CODE_INVALID', 'invalid'],
    ['LOGIN_CODE_DISABLED', 'disabled'],
    ['The user account is not active.', 'inactive'],
    ['TOO_MANY_ATTEMPTS', 'tooManyAttempts'],
    ['something unexpected', 'invalid'],
  ])('reads %j as %s', (message, failure) => {
    expect(loginCodeFailure(message)).toBe(failure);
  });
});

// Mail programs and their scanners open every link in a message before the
// reader does. Opening the page must therefore cost the code nothing and hand
// out no session: only the reader's click redeems it.
describe('login code page', () => {
  it('redeems nothing on the server when the link is opened', async () => {
    const { getServerSideProps } = createLoginCodePage();
    const setHeader = vi.fn();

    const result = await getServerSideProps({
      params: { code: CODE },
      req: {},
      res: { setHeader, getHeader: vi.fn() },
    } as never);

    expect(result).toEqual({ props: { code: CODE } });
    expect(setHeader).not.toHaveBeenCalled();
  });

  // No mutation is mocked: one sent on load would fail the test as unmocked.
  it('redeems nothing in the browser until the reader asks to log in', async () => {
    const { setToken, router } = renderPage();
    await act(() => actWait());

    expect(
      screen.getByRole('button', { name: de.login.code.submit })
    ).toBeTruthy();
    expect(setToken).not.toHaveBeenCalled();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('logs the reader in on their click and goes on to the welcome page', async () => {
    const { setToken, router } = renderPage([redeemed()]);

    await logIn();

    expect(setToken).toHaveBeenCalledWith(
      expect.objectContaining({ token: 'session-token' })
    );
    expect(router.replace).toHaveBeenCalledWith('/welcome?src=purl');
  });

  it.each([
    ['TOTP_REQUIRED', 'totpRequired=1'],
    ['CHALLENGE_REQUIRED', 'challenge=1'],
  ])(
    'hands a code that needs more (%s) to the login page',
    async (message, step) => {
      const { router } = renderPage([refused(message)]);

      await logIn();

      expect(router.replace).toHaveBeenCalledWith(
        `/login?loginCode=${CODE}&${step}`
      );
    }
  );
});

describe('login code page after a failed code', () => {
  const messages: Record<LoginCodeFailure, string> = {
    invalid: 'LOGIN_CODE_INVALID',
    disabled: 'LOGIN_CODE_DISABLED',
    inactive: 'The user account is not active.',
    tooManyAttempts: 'TOO_MANY_ATTEMPTS',
  };

  const renderFailure = async (
    failure: LoginCodeFailure,
    loggedIn: boolean
  ) => {
    renderPage([refused(messages[failure])], loggedIn);
    await logIn();
  };

  it.each(['invalid', 'disabled', 'inactive', 'tooManyAttempts'] as const)(
    'says why the link did not work (%s)',
    async failure => {
      await renderFailure(failure, false);

      expect(screen.getByText(de.login.code.failed[failure])).toBeTruthy();
      expect(
        screen.getByRole('link', { name: de.login.code.failed.toLogin })
      ).toBeTruthy();
    }
  );

  it('offers to continue a session that is still open, instead of silently doing so', async () => {
    await renderFailure('invalid', true);

    expect(
      screen.getByRole('link', { name: de.login.code.failed.continue })
    ).toBeTruthy();
  });

  it('offers no session to continue when nobody is logged in', async () => {
    await renderFailure('invalid', false);

    expect(
      screen.queryByRole('link', { name: de.login.code.failed.continue })
    ).toBeNull();
  });
});
