import { resolveLegacyRedirect } from './legacy-redirect';

describe('resolveLegacyRedirect', () => {
  const byId = { '18558': 'solarworld-ag-recycelt', 'fr/900': 'article-fr' };

  const resolve = (pathname: string) => resolveLegacyRedirect(pathname, byId);

  describe('articles', () => {
    it('sends a legacy id to its new slug', () => {
      expect(resolve('/de/article/18558')).toBe('/a/solarworld-ag-recycelt');
    });

    it('ignores the slug the old url carried', () => {
      expect(resolve('/de/article/18558/whatever-it-used-to-be')).toBe(
        '/a/solarworld-ag-recycelt'
      );
    });

    it('reads the language to disambiguate a dual-language id', () => {
      expect(resolve('/fr/article/900')).toBe('/a/article-fr');
    });

    it('falls back to the old slug when the id is unknown', () => {
      expect(resolve('/de/article/404404/some-slug')).toBe('/a/some-slug');
    });

    it('matches an article under a theme segment', () => {
      expect(resolve('/de/solar/article/18558')).toBe(
        '/a/solarworld-ag-recycelt'
      );
    });

    it('leaves an unknown id with no slug alone', () => {
      expect(resolve('/de/article/404404')).toBeNull();
    });
  });

  describe('taxonomy listings', () => {
    it('sends a theme page to its tag page', () => {
      expect(resolve('/de/solar')).toBe('/a/tag/solar');
    });

    it('url-encodes a tag that is not its own slug', () => {
      expect(resolve('/de/mobilitaet')).toBe('/a/tag/mobilit%C3%A4t');
    });

    it('collapses the paginated variant onto the same tag page', () => {
      expect(resolve('/de/solar/page/4')).toBe('/a/tag/solar');
    });
  });

  describe('cms pages', () => {
    it('honours an explicit override', () => {
      expect(resolve('/de/cms/shortname/donation')).toBe('/mitmachen');
    });

    it('sends everything else to the blanket cms page', () => {
      expect(resolve('/de/cms/shortname/impressum')).toBe('/cms-page');
    });
  });

  describe('agenda and roots', () => {
    it('sends the agenda to the event page', () => {
      expect(resolve('/de/agenda')).toBe('/event');
      expect(resolve('/de/agenda/2024/05')).toBe('/event');
    });

    it('sends a language root home', () => {
      expect(resolve('/de')).toBe('/');
      expect(resolve('/fr')).toBe('/');
    });

    it('sends the event pages home, as next.config.js did', () => {
      expect(resolve('/event')).toBe('/');
      expect(resolve('/events')).toBe('/');
    });
  });

  it('leaves a current url alone', () => {
    expect(resolve('/a/some-article')).toBeNull();
    expect(resolve('/mitmachen')).toBeNull();
    expect(resolve('/')).toBeNull();
  });
});
