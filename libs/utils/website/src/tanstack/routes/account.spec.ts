import { isRedirect } from '@tanstack/react-router';

import { loadLoginCode } from '../pages/login-code-page';
import {
  confirmEmailRoute,
  loginCodeRoute,
  loginSearchSchema,
  profileRoute,
  welcomeRoute,
} from './account';

vi.mock('../pages/login-code-page', async importOriginal => ({
  ...(await importOriginal<object>()),
  loadLoginCode: vi.fn(),
}));

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

  // The router reads `?token=123456` as a number before the schema sees it.
  it('takes a token that is all digits', () => {
    expect(route.validateSearch.parse({ token: 123456 })).toEqual({
      token: 123456,
    });
    expect(() => route.beforeLoad({ search: { token: 123456 } })).not.toThrow();
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

  // `/profile?emailConfirmed=1` is where the confirm-email page sends the
  // reader, and the router hands the `1` over as a number.
  it('takes the note as the router reads it from the address', () => {
    expect(profileRoute().validateSearch.parse({ emailConfirmed: 1 })).toEqual(
      { emailConfirmed: 1 }
    );
  });
});

describe('welcomeRoute', () => {
  it('takes the note that the email address is confirmed as the router reads it', () => {
    expect(
      welcomeRoute().validateSearch.parse({ emailConfirmed: 1, src: 'purl' })
    ).toEqual({ emailConfirmed: 1, src: 'purl' });
  });
});

describe('loginSearchSchema', () => {
  // The personal login link sends a reader who has to pass a second step to
  // the login page with the code; a key the schema does not name is dropped.
  it('keeps the login code and the step it still needs', () => {
    expect(
      loginSearchSchema.parse({
        loginCode: 'ABCDE-12345',
        totpRequired: '1',
        challenge: '1',
      })
    ).toEqual({
      loginCode: 'ABCDE-12345',
      totpRequired: '1',
      challenge: '1',
    });
  });

  // The router reads `totpRequired=1` as the number 1, and a code of digits
  // only as a number too. Refused, the page answers 500; turned into a
  // boolean or a string, the router rewrites the address (`=true`, `="1"`)
  // and answers the reader's first request with a 307 — and the login form
  // looks for exactly `totpRequired=1`.
  it('leaves the address of a code that needs another step as it is', () => {
    const search = { loginCode: 12345678, totpRequired: 1, challenge: 1 };

    expect(loginSearchSchema.parse(search)).toEqual(search);
  });

  // A default would make the router rewrite the address and answer 307.
  it('adds nothing to a plain visit', () => {
    expect(loginSearchSchema.parse({})).toEqual({});
  });
});

describe('loginCodeRoute', () => {
  const route = loginCodeRoute({ next: '/willkommen', loginPath: '/anmelden' });
  const load = (outcome: unknown) => {
    (loadLoginCode as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      outcome
    );

    return route.loader({ params: { code: 'ABCDE 12345' } });
  };
  const sessionToken = { token: 'session-token' };

  it('opens the session of a redeemed code and names where to go on', async () => {
    await expect(load({ kind: 'ok', sessionToken })).resolves.toEqual({
      sessionToken,
      next: '/willkommen',
    });
    expect(loadLoginCode).toHaveBeenCalledWith({
      data: { code: 'ABCDE 12345' },
    });
  });

  it.each([
    ['totpRequired', 'totpRequired=1'],
    ['challengeRequired', 'challenge=1'],
  ])(
    'sends a code that needs another step to the login page (%s)',
    async (kind, step) => {
      const thrown = await load({ kind }).catch((error: unknown) => error);

      expect(isRedirect(thrown)).toBe(true);
      expect((thrown as { options: { href: string } }).options.href).toBe(
        `/anmelden?loginCode=ABCDE%2012345&${step}`
      );
    }
  );

  // Not passed on anywhere: the page says why the link did not work.
  it('keeps a refused code on the page with the reason', async () => {
    await expect(load({ kind: 'failed', failure: 'invalid' })).resolves.toEqual(
      { sessionToken: null, failure: 'invalid' }
    );
  });
});
