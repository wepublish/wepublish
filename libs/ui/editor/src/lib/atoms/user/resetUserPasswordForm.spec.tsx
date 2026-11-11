import { useMutation } from '@apollo/client/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { Mock } from 'vitest';

import { ResetUserPasswordForm } from './resetUserPasswordForm';

const theme = createTheme({ cssVariables: true });

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useMutation: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${Object.values(options).join(',')}` : key,
    i18n: { language: 'en' },
  }),
}));

const mockedUseMutation = useMutation as unknown as Mock;
const resetUserPassword = vi.fn();

const renderForm = (props = {}) =>
  render(
    <ThemeProvider theme={theme}>
      <ResetUserPasswordForm
        userID="user-1"
        userName="Ada"
        onClose={vi.fn()}
        {...props}
      />
    </ThemeProvider>
  );

const typePassword = (value: string) =>
  fireEvent.change(
    screen.getByPlaceholderText('userCreateOrEditView.password'),
    { target: { value } }
  );

const submit = () =>
  fireEvent.click(
    screen.getByRole('button', { name: 'userCreateOrEditView.resetPassword' })
  );

beforeEach(() => {
  resetUserPassword.mockReset();
  resetUserPassword.mockResolvedValue({ data: { resetPassword: true } });
  mockedUseMutation.mockReset();
  mockedUseMutation.mockReturnValue([
    resetUserPassword,
    { loading: false, error: undefined },
  ]);
});

describe('ResetUserPasswordForm', () => {
  it('names the user whose password is being reset', () => {
    renderForm();

    expect(
      screen.getByLabelText('userCreateOrEditView.resetPasswordFor:Ada')
    ).toBeInTheDocument();
  });

  it('refuses an empty password', async () => {
    renderForm();

    submit();

    expect(
      await screen.findByText('errorMessages.noPasswordErrorMessage')
    ).toBeInTheDocument();
    expect(resetUserPassword).not.toHaveBeenCalled();
  });

  it('refuses a password under twelve characters', async () => {
    renderForm();

    typePassword('short');
    submit();

    expect(
      await screen.findByText('errorMessages.passwordTooShortErrorMessage')
    ).toBeInTheDocument();
    expect(resetUserPassword).not.toHaveBeenCalled();
  });

  it('sends a long enough password', async () => {
    renderForm();

    typePassword('a-long-enough-password');
    submit();

    await waitFor(() =>
      expect(resetUserPassword).toHaveBeenCalledWith({
        variables: { id: 'user-1', password: 'a-long-enough-password' },
      })
    );
  });

  it('closes once the password has been changed', async () => {
    const onClose = vi.fn();
    renderForm({ onClose });

    typePassword('a-long-enough-password');
    submit();

    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('does not submit while the mutation is in flight', () => {
    mockedUseMutation.mockReturnValue([
      resetUserPassword,
      { loading: true, error: undefined },
    ]);
    renderForm();

    expect(
      screen.getByRole('button', { name: 'userCreateOrEditView.resetPassword' })
    ).toBeDisabled();
  });
});
