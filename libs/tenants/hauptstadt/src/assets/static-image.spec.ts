import { staticImageSrc } from './static-image';

describe('staticImageSrc', () => {
  it('returns the url of a bundler url import', () => {
    expect(staticImageSrc('/assets/logo.svg')).toBe('/assets/logo.svg');
  });

  it('returns the src of a next static image import', () => {
    expect(
      staticImageSrc({
        src: '/_next/static/media/logo.svg',
        width: 1,
        height: 1,
      })
    ).toBe('/_next/static/media/logo.svg');
  });
});
