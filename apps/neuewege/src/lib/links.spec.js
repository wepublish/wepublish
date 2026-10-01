import { localPath } from './links';

const SITE = 'https://neuewege.ch';

describe('localPath', () => {
  it.each([
    [undefined, '/'],
    [null, '/'],
    ['', '/'],
    ['/', '/'],
    ['agenda', '/agenda'],
    ['/newsletter', '/newsletter'],
    // legacy slugs with dots and percent-encoded umlauts stay as they are
    ['/neue-wege-1.24', '/neue-wege-1.24'],
    ['/gespr%C3%A4ch-6.25', '/gespr%C3%A4ch-6.25'],
    ['gespräch-6.25', '/gespräch-6.25'],
  ])('%j → %j', (slug, path) => {
    expect(localPath(slug)).toBe(path);
  });

  // what a browser makes of the href: it must stay on this site
  it.each([
    '//evil.com',
    '///evil.com',
    '/\\evil.com',
    '\\\\evil.com',
    '\\/evil.com',
    '/\t/evil.com',
    '\n//evil.com',
    '/\r\n/evil.com',
  ])('keeps %j on the site', slug => {
    expect(new URL(localPath(slug), SITE).origin).toBe(SITE);
  });
});
