import {
  GRAPHQL_RESPONSES_PROFILE,
  PAGE_CONTENT_NAMESPACES,
  PUBLIC_CONTENT_SHARED_NAMESPACES,
  WEBSITE_LAYOUT_NAMESPACES,
  articlePagePaths,
  contentCacheNamespace,
} from './public-content-namespaces';

describe('public content namespaces', () => {
  it('shares the content every anonymous page reads', () => {
    expect(PUBLIC_CONTENT_SHARED_NAMESPACES).toEqual([
      'content:articles',
      'content:pages',
      'content:authors',
      'content:images',
      'content:paywalls',
      'content:engagement',
      'content:polls',
      'graphql:comments',
    ]);
  });

  it('shares the comments and polls every logged-in article view reads', () => {
    expect(PUBLIC_CONTENT_SHARED_NAMESPACES).toEqual(
      expect.arrayContaining(['graphql:comments', 'content:polls'])
    );
  });

  it('shares graphql responses within a release through their own profile', () => {
    expect(GRAPHQL_RESPONSES_PROFILE).toEqual({
      name: 'graphql:responses',
      shared: true,
      scope: 'release',
      keyPrefix: 'graphql:responses:',
    });
  });

  it('names the content caches after the content', () => {
    expect(contentCacheNamespace('paywalls')).toBe('content:paywalls');
  });

  it('versions website pages by every namespace a page shows', () => {
    expect(PAGE_CONTENT_NAMESPACES).toEqual([
      'graphql:content',
      'navigations',
      'content:engagement',
      'settings',
      'website-settings',
      'peer-profile',
      'member-plans',
      'peering:remote-profiles',
    ]);
  });
});

describe('website layout', () => {
  it.each([
    'navigations',
    'settings',
    'content:engagement',
    'content:paywalls',
  ])('counts %s as layout every page shows', namespace => {
    expect(WEBSITE_LAYOUT_NAMESPACES).toContain(namespace);
  });

  it.each(['graphql:content', 'content:articles', 'content:images'])(
    'does not count %s as layout',
    namespace => {
      expect(WEBSITE_LAYOUT_NAMESPACES).not.toContain(namespace);
    }
  );
});

describe('articlePagePaths', () => {
  it('names the slug and the id route every website serves an article under', () => {
    expect(articlePagePaths({ id: '1', slug: 'one' })).toEqual([
      '/a/one',
      '/a/id/1',
    ]);
  });

  it('names only the id route without a slug', () => {
    expect(articlePagePaths({ id: '1', slug: null })).toEqual(['/a/id/1']);
  });
});
