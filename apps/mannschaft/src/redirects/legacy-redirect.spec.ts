import { resolveLegacyRedirect } from './legacy-redirect';

describe('resolveLegacyRedirect', () => {
  const table = {
    '/10014': {
      destination: '/a/dr-gay-besteht-beim-lusttropfen-ein-hiv-risiko',
    },
    '/12041': { destination: '/' },
  };

  const resolve = (pathname: string) => resolveLegacyRedirect(pathname, table);

  it('sends a legacy numeric path to its article', () => {
    expect(resolve('/10014')).toBe(
      '/a/dr-gay-besteht-beim-lusttropfen-ein-hiv-risiko'
    );
  });

  it('sends a dropped page home', () => {
    expect(resolve('/12041')).toBe('/');
  });

  it('leaves a path that is not in the table alone', () => {
    expect(resolve('/a/some-article')).toBeNull();
    expect(resolve('/10014/extra')).toBeNull();
    expect(resolve('/')).toBeNull();
  });
});
