import { cacheControlFor, ISR_60, NO_STORE } from './cache-rules';

describe('cacheControlFor', () => {
  // Each of these loads the reader's own data on the server or carries a
  // token or code in its address. Cached, one reader's page is served to the
  // next visitor.
  it.each([
    '/profile',
    '/profile/subscription/sub-1',
    '/profile/subscription/deactivated',
    '/mitmachen',
    '/login',
    '/confirm-email',
    '/welcome',
    '/l/ABCDE-12345',
    '/search',
    '/_serverFn/abc',
  ])('never stores %s', pathname => {
    expect(cacheControlFor(pathname)).toBe(NO_STORE);
  });

  it.each(['/', '/a/some-article', '/author', '/event', '/logins', '/lager'])(
    'gives %s the window of a page without content to judge',
    pathname => {
      expect(cacheControlFor(pathname)).toBe(ISR_60);
    }
  );

  // Byte for byte what the Next tenants send; Cloudflare must not get the
  // revalidate window as `s-maxage`.
  it('sends the same header as the Next tenants', () => {
    expect(ISR_60).toBe(
      'public, max-age=59, s-maxage=59, stale-if-error=86400'
    );
  });

  it('keeps hashed build assets for good', () => {
    expect(cacheControlFor('/_build/assets/app-abc123.js')).toBe(
      'public, max-age=31536000, immutable'
    );
  });
});
