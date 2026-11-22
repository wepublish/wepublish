import { referrerPolicyFor } from './referrer-policy';

describe('referrerPolicyFor', () => {
  // These addresses carry a token or code, or lead into the account: where
  // the reader goes next must not learn them.
  it.each([
    '/login',
    '/confirm-email',
    '/welcome',
    '/l/ABCDE-12345',
    '/profile',
    '/profile/subscription/sub-1',
  ])('sends no referrer from %s', pathname => {
    expect(referrerPolicyFor(pathname)).toBe('no-referrer');
  });

  it.each(['/', '/a/some-article', '/mitmachen', '/logins', '/profiles'])(
    'sends only the origin across sites from %s',
    pathname => {
      expect(referrerPolicyFor(pathname)).toBe(
        'strict-origin-when-cross-origin'
      );
    }
  );
});
