import { isRedirect } from '@tanstack/react-router';

import { confirmEmailRoute, profileRoute } from './account';

describe('confirmEmailRoute', () => {
  const route = confirmEmailRoute({ loginPath: '/anmelden' });

  it('reads the token from the confirmation link', () => {
    expect(route.validateSearch.parse({ token: 'confirm-token' })).toEqual({
      token: 'confirm-token',
    });
  });

  it('sends a visit without a token to the login page', () => {
    let thrown: unknown;

    try {
      route.beforeLoad({ search: {} });
    } catch (error) {
      thrown = error;
    }

    expect(isRedirect(thrown)).toBe(true);
    expect((thrown as { options: { href: string } }).options.href).toBe(
      '/anmelden'
    );
  });

  it('lets a visit with a token through', () => {
    expect(() =>
      route.beforeLoad({ search: { token: 'confirm-token' } })
    ).not.toThrow();
  });
});

describe('profileRoute', () => {
  // The confirm-email page sends the reader here once the new address is in
  // place; a search key the schema does not name is dropped.
  it('keeps the note that the new email address is confirmed', () => {
    expect(
      profileRoute().validateSearch.parse({ emailConfirmed: '1' })
    ).toMatchObject({ emailConfirmed: '1' });
  });
});

// Mails sent before the confirmation moved to /confirm-email link to the
// profile with `?jwt=…&confirmEmailChange=…`; the token confirms the address
// and no longer logs anyone in.
describe('profileRoute and confirmation links of the old kind', () => {
  const route = profileRoute();

  it('passes them on to /confirm-email', () => {
    let thrown: unknown;

    try {
      route.beforeLoad({
        search: { jwt: 'confirm token', confirmEmailChange: 'new@example.com' },
      });
    } catch (error) {
      thrown = error;
    }

    expect(isRedirect(thrown)).toBe(true);
    expect((thrown as { options: { href: string } }).options.href).toBe(
      '/confirm-email?token=confirm%20token'
    );
  });

  it('leaves a login link alone', () => {
    expect(() =>
      route.beforeLoad({ search: { jwt: 'login-jwt' } })
    ).not.toThrow();
  });

  it('keeps both parameters of such a link', () => {
    expect(
      route.validateSearch.parse({
        jwt: 'confirm-token',
        confirmEmailChange: 'new@example.com',
      })
    ).toMatchObject({
      jwt: 'confirm-token',
      confirmEmailChange: 'new@example.com',
    });
  });
});
