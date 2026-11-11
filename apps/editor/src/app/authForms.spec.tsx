import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { Login } from './login';
import { LoginJwt } from './loginJwt';
import { ResetPassword } from './resetPassword';
import { SetNewPassword } from './setNewPassword';

const authenticate = vi.fn();
const sendPasswordReset = vi.fn();
const resetPassword = vi.fn();
const authenticateWithJwt = vi.fn();
const enableTotp = vi.fn();
const generateTotpSetup = vi.fn(async () => ({ data: undefined }));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@wepublish/editor/api', async importOriginal => ({
  ...(await importOriginal<object>()),
  CheckLoginOtpDocument: 'CheckLoginOtp',
  CreateSessionDocument: 'CreateSession',
  CreateSessionWithJwtDocument: 'CreateSessionWithJwt',
  EnableTotpDocument: 'EnableTotp',
  GenerateTotpSetupDocument: 'GenerateTotpSetup',
  SendPasswordResetEmailDocument: 'SendPasswordResetEmail',
  ResetPasswordWithTokenDocument: 'ResetPasswordWithToken',
}));

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useLazyQuery: () => [vi.fn(async () => ({ data: undefined }))],
  useMutation: (document: string) => {
    const mutations: Record<string, unknown> = {
      CreateSession: authenticate,
      CreateSessionWithJwt: authenticateWithJwt,
      EnableTotp: enableTotp,
      GenerateTotpSetup: generateTotpSetup,
      SendPasswordResetEmail: sendPasswordReset,
      ResetPasswordWithToken: resetPassword,
    };

    return [mutations[document] ?? vi.fn(), { loading: false }];
  },
}));

vi.mock('./ui/loginBackground', () => ({ Background: () => null }));

const theme = createTheme({ cssVariables: true });

const renderPage = (page: ReactNode, url = '/login') =>
  render(
    <ThemeProvider theme={theme}>
      <MemoryRouter initialEntries={[url]}>{page}</MemoryRouter>
    </ThemeProvider>
  );

const type = (name: RegExp | string, value: string) =>
  fireEvent.change(screen.getByLabelText(name), { target: { value } });

beforeEach(() => {
  authenticate.mockReset();
  sendPasswordReset.mockReset();
  resetPassword.mockReset();
  authenticateWithJwt.mockReset();
  enableTotp.mockReset();
});

describe('Login', () => {
  it('has a page heading', () => {
    renderPage(<Login />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'login.login' })
    ).toBeInTheDocument();
  });

  it('keeps a failed login on the page until the reader changes something', async () => {
    authenticate.mockRejectedValue(
      new Error('The provided credentials are invalid.')
    );
    renderPage(<Login />);

    type('login.email', 'nobody@example.invalid');
    type('login.password', 'x');
    fireEvent.click(screen.getByRole('button', { name: 'login.login' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The provided credentials are invalid.'
    );
    expect(screen.getByLabelText('login.password')).toHaveAttribute(
      'aria-invalid',
      'true'
    );

    type('login.password', 'y');

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('keeps a failed 2FA setup on the page without blaming the code field', async () => {
    authenticate.mockResolvedValue({
      data: {
        createSession: {
          token: 'session',
          totpEnabled: false,
          user: { email: 'someone@example.com', totpExempt: false, roles: [] },
        },
      },
    });
    generateTotpSetup.mockRejectedValueOnce(new Error('setup failed'));
    renderPage(<Login />);

    type('login.email', 'someone@example.com');
    type('login.password', 'x');
    fireEvent.click(screen.getByRole('button', { name: 'login.login' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'login.totp.setupError'
    );
    expect(screen.getByLabelText('login.totp.code')).not.toHaveAttribute(
      'aria-invalid',
      'true'
    );

    type('login.totp.code', '123456');

    expect(screen.getByRole('alert')).toHaveTextContent(
      'login.totp.setupError'
    );
  });
});

describe('ResetPassword', () => {
  it('has a page heading', () => {
    renderPage(<ResetPassword />, '/login/reset-password');

    expect(
      screen.getByRole('heading', { level: 1, name: 'resetPassword.title' })
    ).toBeInTheDocument();
  });

  it('announces that the link was sent and keeps focus on the page', async () => {
    sendPasswordReset.mockResolvedValue({});
    renderPage(<ResetPassword />, '/login/reset-password');

    type('login.email', 'someone@example.com');
    fireEvent.click(
      screen.getByRole('button', { name: 'resetPassword.submit' })
    );

    expect(await screen.findByRole('status')).toHaveTextContent(
      'resetPassword.sent'
    );
    await waitFor(() =>
      expect(
        screen.getByRole('link', { name: 'resetPassword.backToLogin' })
      ).toHaveFocus()
    );
  });
});

describe('SetNewPassword', () => {
  const url = '/login/set-password?jwt=token';

  it('has a page heading', () => {
    renderPage(<SetNewPassword />, url);

    expect(
      screen.getByRole('heading', { level: 1, name: 'setNewPassword.submit' })
    ).toBeInTheDocument();
  });

  it('marks the repeated password when the two do not match', async () => {
    renderPage(<SetNewPassword />, url);

    type('setNewPassword.password', 'one');
    type('setNewPassword.passwordRepeat', 'two');
    fireEvent.click(
      screen.getByRole('button', { name: 'setNewPassword.submit' })
    );

    const repeat = screen.getByLabelText('setNewPassword.passwordRepeat');

    expect(repeat).toHaveAttribute('aria-invalid', 'true');
    expect(repeat).toHaveAccessibleDescription('setNewPassword.mismatch');
    await waitFor(() => expect(repeat).toHaveFocus());
  });

  it('keeps a server error on the page', async () => {
    resetPassword.mockRejectedValue(new Error('Token expired'));
    renderPage(<SetNewPassword />, url);

    type('setNewPassword.password', 'same');
    type('setNewPassword.passwordRepeat', 'same');
    fireEvent.click(
      screen.getByRole('button', { name: 'setNewPassword.submit' })
    );

    expect(await screen.findByRole('alert')).toHaveTextContent('Token expired');
  });

  it('announces success and moves focus to the way back to login', async () => {
    resetPassword.mockResolvedValue({});
    renderPage(<SetNewPassword />, url);

    type('setNewPassword.password', 'same');
    type('setNewPassword.passwordRepeat', 'same');
    fireEvent.click(
      screen.getByRole('button', { name: 'setNewPassword.submit' })
    );

    expect(await screen.findByRole('status')).toHaveTextContent(
      'setNewPassword.success'
    );
    await waitFor(() =>
      expect(
        screen.getByRole('link', { name: 'setNewPassword.goToLogin' })
      ).toHaveFocus()
    );
  });
});

describe('LoginJwt', () => {
  const renderJwt = () =>
    renderPage(
      <Routes>
        <Route
          path="/login/jwt/:jwt"
          element={<LoginJwt />}
        />
      </Routes>,
      '/login/jwt/token'
    );

  beforeEach(() => {
    authenticateWithJwt.mockResolvedValue({
      data: {
        createSessionWithJWT: {
          token: 'session',
          totpEnabled: false,
          user: { email: 'someone@example.com', totpExempt: false },
        },
      },
    });
  });

  it('has a page heading while signing in', () => {
    authenticateWithJwt.mockReturnValue(new Promise(() => undefined));
    renderJwt();

    expect(
      screen.getByRole('heading', { level: 1, name: 'login.login' })
    ).toBeInTheDocument();
  });

  it('has a page heading on the 2FA setup', async () => {
    renderJwt();

    await screen.findByLabelText('login.totp.code');

    expect(
      screen.getByRole('heading', { level: 1, name: 'login.login' })
    ).toBeInTheDocument();
  });

  it('keeps a wrong 2FA code on the page until the reader changes it', async () => {
    enableTotp.mockRejectedValue(new Error('Invalid code'));
    renderJwt();

    await screen.findByLabelText('login.totp.code');
    type('login.totp.code', '123456');
    fireEvent.click(
      screen.getByRole('button', { name: 'login.totp.activate' })
    );

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid code');
    expect(screen.getByLabelText('login.totp.code')).toHaveAttribute(
      'aria-invalid',
      'true'
    );

    type('login.totp.code', '654321');

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('keeps a failed 2FA setup on the page without blaming the code field', async () => {
    generateTotpSetup.mockRejectedValueOnce(new Error('setup failed'));
    renderJwt();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'login.totp.setupError'
    );
    expect(screen.getByLabelText('login.totp.code')).not.toHaveAttribute(
      'aria-invalid',
      'true'
    );

    type('login.totp.code', '123456');

    expect(screen.getByRole('alert')).toHaveTextContent(
      'login.totp.setupError'
    );
  });
});
