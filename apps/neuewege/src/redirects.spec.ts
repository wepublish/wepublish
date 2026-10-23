import { redirects } from './redirects';

describe('neuewege redirects', () => {
  it('keeps the redirects of the shared website config', async () => {
    expect(await redirects()).toContainEqual({
      source: '/profile/subscription',
      destination: '/profile',
      permanent: true,
    });
  });

  it('sends the /p/ links of the renewal mail to the real path, revocably', async () => {
    expect(await redirects()).toContainEqual({
      source: '/p/:path*',
      destination: '/:path*',
      permanent: false,
    });
  });
});
