import { isRedirect } from '@tanstack/react-router';

import { renewalMailRedirect } from './legacy-redirects';

const thrownBy = (fn: () => unknown) => {
  try {
    fn();
  } catch (error) {
    return error;
  }

  throw new Error('expected a redirect to be thrown');
};

describe('renewalMailRedirect', () => {
  it('sends a /p/ link to the real path and keeps the login token', () => {
    const result = thrownBy(() =>
      renewalMailRedirect({
        params: { _splat: 'profile' },
        location: { searchStr: '?jwt=abc' },
      })
    );

    expect(isRedirect(result)).toBe(true);
    expect((result as Response).headers.get('Location')).toBe(
      '/profile?jwt=abc'
    );
  });

  it('keeps nested paths', () => {
    const result = thrownBy(() =>
      renewalMailRedirect({
        params: { _splat: 'profile/subscription/123' },
        location: { searchStr: '' },
      })
    );

    expect((result as Response).headers.get('Location')).toBe(
      '/profile/subscription/123'
    );
  });

  it('is revocable, not permanent', () => {
    const result = thrownBy(() =>
      renewalMailRedirect({
        params: { _splat: 'profile' },
        location: { searchStr: '' },
      })
    );

    expect((result as Response).status).toBe(307);
  });
});
