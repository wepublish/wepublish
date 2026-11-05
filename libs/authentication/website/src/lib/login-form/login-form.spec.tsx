import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@wepublish/mocks/website';
import { BuilderLoginFormProps } from '@wepublish/website/builder';
import { t } from 'i18next';
import { LoginForm } from './login-form';

const idle = { data: undefined, loading: false, error: undefined };

const renderLoginForm = (props: Partial<BuilderLoginFormProps> = {}) => {
  const callbacks = {
    onSubmitLoginWithCredentials: vi.fn(),
    onSubmitLoginWithEmail: vi.fn(),
    onEmailChange: vi.fn(),
  };

  renderWithProviders(
    <LoginForm
      loginWithCredentials={idle}
      loginWithEmail={idle}
      {...callbacks}
      {...props}
    />
  );

  return { ...callbacks, user: userEvent.setup() };
};

const emailField = () => screen.getByLabelText(t('login.email'));
const passwordField = () => screen.queryByLabelText(t('login.password'));
const button = (key: string, options?: Record<string, unknown>) =>
  screen.getByRole('button', { name: t(key, options) });

describe('LoginForm', () => {
  it('starts with the login link and offers password login as an alternative', () => {
    renderLoginForm();

    expect(emailField()).toHaveFocus();
    expect(button('login.loginWithLink')).toBeEnabled();
    expect(button('login.loginWithPassword')).toBeInTheDocument();
    expect(passwordField()).not.toBeInTheDocument();
  });

  it('requests a login link for the entered email', async () => {
    const { user, onSubmitLoginWithEmail, onSubmitLoginWithCredentials } =
      renderLoginForm();

    await user.type(emailField(), 'foobar@email.com');
    await user.click(button('login.loginWithLink'));

    expect(onSubmitLoginWithEmail).toHaveBeenCalledWith('foobar@email.com');
    expect(onSubmitLoginWithCredentials).not.toHaveBeenCalled();
  });

  it('reports every email change so the container can check for 2FA', async () => {
    const { user, onEmailChange } = renderLoginForm();

    await user.type(emailField(), 'a@b.ch');

    expect(onEmailChange).toHaveBeenLastCalledWith('a@b.ch');
  });

  it('does not request a login link without an email', async () => {
    const { user, onSubmitLoginWithEmail } = renderLoginForm();

    await user.click(button('login.loginWithLink'));

    expect(emailField()).toHaveAttribute('aria-invalid', 'true');
    expect(onSubmitLoginWithEmail).not.toHaveBeenCalled();
  });

  it('does not request a login link for something that is not an email', async () => {
    const { user, onSubmitLoginWithEmail } = renderLoginForm();

    await user.type(emailField(), 'foobar');
    await user.click(button('login.loginWithLink'));

    expect(emailField()).toBeInvalid();
    expect(onSubmitLoginWithEmail).not.toHaveBeenCalled();
  });

  it('focuses the password when switching to password login and can switch back', async () => {
    const { user } = renderLoginForm();

    await user.click(button('login.loginWithPassword'));

    expect(passwordField()).toHaveFocus();

    await user.click(button('login.useLinkInstead'));

    expect(passwordField()).not.toBeInTheDocument();
    expect(button('login.loginWithLink')).toBeInTheDocument();
  });

  it('logs in with email and password', async () => {
    const { user, onSubmitLoginWithCredentials, onSubmitLoginWithEmail } =
      renderLoginForm();

    await user.click(button('login.loginWithPassword'));
    await user.type(emailField(), 'foobar@email.com');
    await user.type(screen.getByLabelText(t('login.password')), '12345678');
    await user.click(button('login.submit'));

    expect(onSubmitLoginWithCredentials).toHaveBeenCalledWith(
      'foobar@email.com',
      '12345678',
      undefined
    );
    expect(onSubmitLoginWithEmail).not.toHaveBeenCalled();
  });

  it('does not log in without a password', async () => {
    const { user, onSubmitLoginWithCredentials } = renderLoginForm();

    await user.click(button('login.loginWithPassword'));
    await user.type(emailField(), 'foobar@email.com');
    await user.click(button('login.submit'));

    expect(passwordField()).toHaveAttribute('aria-invalid', 'true');
    expect(onSubmitLoginWithCredentials).not.toHaveBeenCalled();
  });

  it('confirms the sent link and blocks a new one during the cooldown', () => {
    renderLoginForm({
      defaults: { email: 'foobar@email.com' },
      loginWithEmail: {
        ...idle,
        data: { __typename: 'Mutation', sendWebsiteLogin: 'foobar@email.com' },
      },
      loginLinkCooldownSeconds: 42,
    });

    expect(screen.getByRole('alert')).toHaveTextContent(
      t('login.alertLoginLinkSent', { email: 'foobar@email.com' })
    );
    expect(button('login.requestNewLinkIn', { seconds: 42 })).toBeDisabled();
  });

  it('hides the confirmation once the reader enters another email', async () => {
    const { user } = renderLoginForm({
      defaults: { email: 'foobar@email.com' },
      loginWithEmail: {
        ...idle,
        data: { __typename: 'Mutation', sendWebsiteLogin: 'foobar@email.com' },
      },
    });

    await user.type(emailField(), 'x');

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows a failed login link request only while logging in with a link', async () => {
    const { user } = renderLoginForm({
      loginWithEmail: { ...idle, error: new Error('Something went wrong.') },
    });

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Something went wrong.'
    );

    await user.click(button('login.loginWithPassword'));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows failed credentials in password mode', () => {
    renderLoginForm({
      defaults: { requirePassword: true },
      loginWithCredentials: {
        ...idle,
        error: new Error('Invalid Credentials'),
      },
    });

    expect(screen.getByRole('alert')).toHaveTextContent('Invalid Credentials');
  });

  it('only offers the login link when password login is disabled', () => {
    renderLoginForm({ disablePasswordLogin: true });

    expect(button('login.loginWithLink')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: t('login.loginWithPassword') })
    ).not.toBeInTheDocument();
  });

  it('tells the reader the credentials are being verified and blocks a second submit', () => {
    renderLoginForm({
      defaults: { requirePassword: true },
      loginWithCredentials: { ...idle, loading: true },
    });

    expect(screen.getByRole('alert')).toHaveTextContent(
      t('login.verifyingCredentials')
    );
    expect(button('login.submit')).toBeDisabled();
  });

  it('blocks a second login link request while the first is sent', () => {
    renderLoginForm({ loginWithEmail: { ...idle, loading: true } });

    expect(button('login.loginWithLink')).toBeDisabled();
  });

  it('sends the 2FA code along with the credentials', async () => {
    const { user, onSubmitLoginWithCredentials } = renderLoginForm({
      defaults: { requirePassword: true },
      otpRequired: true,
    });

    await user.type(emailField(), 'foobar@email.com');
    await user.type(screen.getByLabelText(t('login.password')), '12345678');
    await user.type(screen.getByLabelText(t('login.totp.code')), '123456');
    await user.click(button('login.submit'));

    expect(onSubmitLoginWithCredentials).toHaveBeenCalledWith(
      'foobar@email.com',
      '12345678',
      '123456'
    );
  });

  it('does not ask for a 2FA code in link mode', () => {
    renderLoginForm({ otpRequired: true });

    expect(
      screen.queryByLabelText(t('login.totp.code'))
    ).not.toBeInTheDocument();
  });

  it('starts in password mode without a way back after a 2FA redirect', () => {
    renderLoginForm({ otpRequired: true, totpRedirectToPassword: true });

    expect(passwordField()).toBeInTheDocument();
    expect(screen.getByLabelText(t('login.totp.code'))).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(
      t('login.totp.emailLoginDisabled')
    );
    expect(
      screen.queryByRole('button', { name: t('login.useLinkInstead') })
    ).not.toBeInTheDocument();
  });
});
