import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  mockCheckLoginOtpQuery,
  mockOperation,
  mockSession,
  renderWithProviders,
} from '@wepublish/mocks/website';
import {
  CheckLoginOtpDocument,
  LoginWithCredentialsDocument,
  LoginWithEmailDocument,
  SettingListDocument,
  SettingName,
} from '@wepublish/website/api';
import { t } from 'i18next';
import { LoginFormContainer } from './login-form-container';
import { LOGIN_LINK_STORAGE_KEY } from './login-link-cooldown';

const email = 'foobar@email.com';
const session = mockSession();

const checkLoginOtp = (checkLoginOtp: boolean) =>
  mockOperation(CheckLoginOtpDocument, {
    variables: { email },
    data: { __typename: 'Query', checkLoginOtp },
  });

const loginWithCredentials = mockOperation(LoginWithCredentialsDocument, {
  variables: { email, password: '12345678' },
  data: { __typename: 'Mutation', createSession: session },
});

const loginCodeSetting = (enabled: boolean) =>
  mockOperation(SettingListDocument, {
    data: {
      __typename: 'Query',
      settings: [
        {
          __typename: 'Setting',
          id: 'login-code-enabled',
          name: SettingName.LoginCodeEnabled,
          value: enabled,
        },
      ],
    },
  });

const button = (key: string, options?: Record<string, unknown>) =>
  screen.getByRole('button', { name: t(key, options) });

const logInWithPassword = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(button('login.loginWithPassword'));
  await user.type(screen.getByLabelText(t('login.email')), email);
  await user.type(screen.getByLabelText(t('login.password')), '12345678');
  await user.click(button('login.submit'));
};

describe('LoginFormContainer', () => {
  beforeEach(() => {
    localStorage.removeItem(LOGIN_LINK_STORAGE_KEY);
  });

  afterEach(() => {
    window.history.replaceState(null, '', '/');
  });

  it('sends the login link and starts the cooldown', async () => {
    const user = userEvent.setup();

    renderWithProviders(<LoginFormContainer />, {
      mocks: [
        loginCodeSetting(false),
        mockCheckLoginOtpQuery(),
        mockOperation(LoginWithEmailDocument, {
          variables: { email },
          data: { __typename: 'Mutation', sendWebsiteLogin: email },
        }),
      ],
    });

    await user.type(screen.getByLabelText(t('login.email')), email);
    await user.click(button('login.loginWithLink'));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      t('login.alertLoginLinkSent', { email })
    );
    expect(button('login.requestNewLinkIn', { seconds: 60 })).toBeDisabled();
    expect(
      Number(localStorage.getItem(LOGIN_LINK_STORAGE_KEY))
    ).toBeGreaterThan(0);
  });

  it('shows the error and does not start the cooldown when the login link fails', async () => {
    const user = userEvent.setup();

    renderWithProviders(<LoginFormContainer />, {
      mocks: [
        loginCodeSetting(false),
        mockCheckLoginOtpQuery(),
        mockOperation(LoginWithEmailDocument, {
          variables: { email },
          errors: [{ message: 'Something went wrong.' }],
        }),
      ],
    });

    await user.type(screen.getByLabelText(t('login.email')), email);
    await user.click(button('login.loginWithLink'));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Something went wrong.'
    );
    expect(button('login.loginWithLink')).toBeEnabled();
    expect(localStorage.getItem(LOGIN_LINK_STORAGE_KEY)).toBeNull();
  });

  it('logs in with credentials, stores the session and calls back', async () => {
    const user = userEvent.setup();
    const afterLoginCallback = vi.fn();

    const { setToken } = renderWithProviders(
      <LoginFormContainer afterLoginCallback={afterLoginCallback} />,
      {
        mocks: [
          loginCodeSetting(false),
          mockCheckLoginOtpQuery(),
          loginWithCredentials,
        ],
      }
    );

    await logInWithPassword(user);

    await waitFor(() => expect(afterLoginCallback).toHaveBeenCalledTimes(1));
    expect(setToken).toHaveBeenCalledWith({
      __typename: 'SessionWithTokenWithoutUser',
      token: session.token,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
    });
  });

  it('shows the error and stays logged out when the credentials are wrong', async () => {
    const user = userEvent.setup();
    const afterLoginCallback = vi.fn();

    const { setToken } = renderWithProviders(
      <LoginFormContainer afterLoginCallback={afterLoginCallback} />,
      {
        mocks: [
          loginCodeSetting(false),
          mockCheckLoginOtpQuery(),
          mockOperation(LoginWithCredentialsDocument, {
            variables: { email, password: '12345678' },
            errors: [{ message: 'Invalid Credentials' }],
          }),
        ],
      }
    );

    await logInWithPassword(user);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Invalid Credentials'
    );
    expect(setToken).not.toHaveBeenCalled();
    expect(afterLoginCallback).not.toHaveBeenCalled();
  });

  it('asks for the 2FA code once the email belongs to a 2FA account', async () => {
    const user = userEvent.setup();

    renderWithProviders(<LoginFormContainer />, {
      mocks: [loginCodeSetting(false), checkLoginOtp(true)],
    });

    await user.click(button('login.loginWithPassword'));
    await user.type(screen.getByLabelText(t('login.email')), email);

    expect(
      await screen.findByLabelText(t('login.totp.code'))
    ).toBeInTheDocument();
  });

  it('starts with password and 2FA code after a failed login link of a 2FA account', () => {
    window.history.replaceState(null, '', '/login?totpRequired=1');

    renderWithProviders(<LoginFormContainer />, {
      mocks: [loginCodeSetting(false)],
    });

    expect(screen.getByLabelText(t('login.password'))).toBeInTheDocument();
    expect(screen.getByLabelText(t('login.totp.code'))).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(
      t('login.totp.emailLoginDisabled')
    );
  });

  it('offers the login code when login codes are enabled', async () => {
    renderWithProviders(<LoginFormContainer />, {
      mocks: [loginCodeSetting(true)],
    });

    expect(
      await screen.findByText(t('login.code.haveCode'))
    ).toBeInTheDocument();
  });

  it('falls back to the normal login, even from a link carrying a code, when login codes are disabled', async () => {
    renderWithProviders(
      <LoginFormContainer
        defaults={{ useLoginCode: true, loginCode: 'ABCDE-FGHJK' }}
      />,
      { mocks: [loginCodeSetting(false)] }
    );

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: t('login.loginWithPassword') })
      ).toBeInTheDocument()
    );
    expect(screen.queryByText(t('login.code.haveCode'))).toBeNull();
    expect(screen.queryByDisplayValue('ABCDE-FGHJK')).toBeNull();
  });
});
