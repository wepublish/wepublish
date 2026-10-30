import { catalogs, lookup, routerPaths } from '../testing/routerPaths';
import { PAGE_TITLES, pageTitleKey } from './pageTitles';

describe('editor page titles', () => {
  it('names every route the editor has', () => {
    const untitled = routerPaths().filter(path => !(path in PAGE_TITLES));

    expect(untitled).toEqual([]);
  });

  it('names no route the router does not serve', () => {
    const paths = new Set(routerPaths());
    const dangling = Object.keys(PAGE_TITLES).filter(path => !paths.has(path));

    expect(dangling).toEqual([]);
  });

  it.each(['en', 'de', 'fr'] as const)(
    'has every page title translated in %s',
    language => {
      const untranslated = Object.values(PAGE_TITLES).filter(
        key => typeof lookup(catalogs[language], key) !== 'string'
      );

      expect(untranslated).toEqual([]);
    }
  );

  it.each([
    ['/articles', 'pageTitles.articles'],
    ['/articles/edit/abc-123', 'pageTitles.articleEdit'],
    ['/articles/tags', 'pageTitles.articleTags'],
    ['/articles/tags/edit/abc-123', 'pageTitles.articleTagEdit'],
    ['/images/upload', 'pageTitles.imageUpload'],
    ['/api-tokens/generate', 'pageTitles.apiTokenGenerate'],
    ['/settings/website/general', 'pageTitles.websiteSettings'],
    ['/gift-codes/offers/edit/abc-123', 'pageTitles.giftCodeOfferEdit'],
    ['/', 'pageTitles.dashboard'],
  ])('titles %s as %s', (pathname, key) => {
    expect(pageTitleKey(pathname)).toBe(key);
  });

  it('leaves a path the router does not know untitled', () => {
    expect(pageTitleKey('/nowhere/to/be/found')).toBeUndefined();
  });
});
