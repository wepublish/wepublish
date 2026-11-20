import { screen } from '@testing-library/react';
import {
  mockSensitiveDataUser,
  renderWithProviders,
} from '@wepublish/mocks/website';
import de from '@wepublish/website/translations/de.json';
import {
  createLoginCodePage,
  LoginCodeFailure,
  loginCodeFailure,
} from './login-code-page';

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

describe('login code page after a failed code', () => {
  const renderFailure = (failure: LoginCodeFailure, loggedIn: boolean) => {
    const { Page } = createLoginCodePage();

    renderWithProviders(<Page failure={failure} />, {
      user: loggedIn ? mockSensitiveDataUser() : null,
    });
  };

  it.each(['invalid', 'disabled', 'inactive', 'tooManyAttempts'] as const)(
    'says why the link did not work (%s)',
    failure => {
      renderFailure(failure, false);

      expect(screen.getByText(de.login.code.failed[failure])).toBeTruthy();
      expect(
        screen.getByRole('link', { name: de.login.code.failed.toLogin })
      ).toBeTruthy();
    }
  );

  it('offers to continue a session that is still open, instead of silently doing so', () => {
    renderFailure('invalid', true);

    expect(
      screen.getByRole('link', { name: de.login.code.failed.continue })
    ).toBeTruthy();
  });

  it('offers no session to continue when nobody is logged in', () => {
    renderFailure('invalid', false);

    expect(
      screen.queryByRole('link', { name: de.login.code.failed.continue })
    ).toBeNull();
  });
});
