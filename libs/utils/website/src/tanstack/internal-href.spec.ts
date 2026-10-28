import { toInternalHref } from './internal-href';

const SITE = 'https://gruppetto-magazin.ch';

describe('toInternalHref', () => {
  it('routes a plain path', () => {
    expect(toInternalHref('/a/some-article', SITE)).toBe('/a/some-article');
  });

  it('keeps query and hash on a plain path', () => {
    expect(toInternalHref('/search?q=velo#top', SITE)).toBe(
      '/search?q=velo#top'
    );
  });

  it('routes an absolute url pointing at this very site', () => {
    expect(toInternalHref(`${SITE}/mitmachen`, SITE)).toBe('/mitmachen');
  });

  it('keeps query and hash when stripping the origin', () => {
    expect(toInternalHref(`${SITE}/a/x?page=2#end`, SITE)).toBe(
      '/a/x?page=2#end'
    );
  });

  it('tolerates a trailing slash on the configured site url', () => {
    expect(toInternalHref(`${SITE}/mitmachen`, `${SITE}/`)).toBe('/mitmachen');
  });

  it('ignores the scheme, so an http link to the https site still routes', () => {
    expect(toInternalHref('http://gruppetto-magazin.ch/abo', SITE)).toBe(
      '/abo'
    );
  });

  it('routes a protocol-relative url on this site', () => {
    expect(toInternalHref('//gruppetto-magazin.ch/abo', SITE)).toBe('/abo');
  });

  it('leaves another host alone', () => {
    expect(
      toInternalHref('https://shop.gruppetto-magazin.ch/x', SITE)
    ).toBeNull();
  });

  it('leaves a bare absolute url alone when no site url is configured', () => {
    expect(toInternalHref(`${SITE}/mitmachen`, undefined)).toBeNull();
    expect(toInternalHref(`${SITE}/mitmachen`, '')).toBeNull();
  });

  it('leaves mailto, tel and sms alone', () => {
    expect(toInternalHref('mailto:a@b.ch', SITE)).toBeNull();
    expect(toInternalHref('tel:+41791234567', SITE)).toBeNull();
    expect(toInternalHref('sms:+41791234567', SITE)).toBeNull();
  });

  it('leaves a bare hash alone, so the router does not resolve it as a path', () => {
    expect(toInternalHref('#kommentare', SITE)).toBeNull();
  });

  it('leaves an empty href alone', () => {
    expect(toInternalHref('', SITE)).toBeNull();
  });

  it('survives a malformed site url', () => {
    expect(toInternalHref(`${SITE}/x`, 'not a url')).toBeNull();
  });
});
