import { resolveLegacyRedirect } from './legacy-redirect';

describe('resolveLegacyRedirect', () => {
  it('sends an old research url and its short form to the article', () => {
    expect(resolveLegacyRedirect('/recherchen/asylatlas')).toEqual({
      destination: '/a/asylatlas',
      permanent: true,
    });
    expect(resolveLegacyRedirect('/asylatlas')).toEqual({
      destination: '/a/asylatlas',
      permanent: true,
    });
  });

  it('resolves an alias to the article it stands for', () => {
    expect(resolveLegacyRedirect('/asy')?.destination).toBe('/a/asylatlas');
    expect(resolveLegacyRedirect('/recherchen/asy')?.destination).toBe(
      '/a/asylatlas'
    );
  });

  it('sends the old shop and account paths to the login', () => {
    expect(resolveLegacyRedirect('/kasse')?.destination).toBe('/login');
    expect(resolveLegacyRedirect('/kasse/bestellung/123')?.destination).toBe(
      '/login'
    );
    expect(resolveLegacyRedirect('/mein-konto')?.destination).toBe('/login');
  });

  it('sends the wiki to its own site', () => {
    const wiki = 'https://wiki.reflekt.ch/';

    expect(resolveLegacyRedirect('/wikipolitik')?.destination).toBe(wiki);
    expect(resolveLegacyRedirect('/recherchen/wikipolitik')?.destination).toBe(
      wiki
    );
    expect(resolveLegacyRedirect('/a/wikipolitik')?.destination).toBe(wiki);
  });

  it('keeps the crowdfunding redirect temporary', () => {
    expect(resolveLegacyRedirect('/crowdfunding')).toEqual({
      destination: '/mitmachen',
      permanent: false,
    });
  });

  it('sends the subscription index to the profile', () => {
    expect(resolveLegacyRedirect('/profile/subscription')).toEqual({
      destination: '/profile',
      permanent: true,
    });
  });

  it('ignores a trailing slash', () => {
    expect(resolveLegacyRedirect('/spenden/')?.destination).toBe('/mitmachen');
  });

  it('leaves current paths alone', () => {
    expect(resolveLegacyRedirect('/')).toBeNull();
    expect(resolveLegacyRedirect('/a/asylatlas')).toBeNull();
    expect(resolveLegacyRedirect('/mitmachen')).toBeNull();
    expect(resolveLegacyRedirect('/kasse-nicht')).toBeNull();
    expect(resolveLegacyRedirect('/profile/subscription/abc')).toBeNull();
  });
});
