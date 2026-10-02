import {
  SHARED_NAMESPACES,
  articlePagePaths,
  assertSharedNamespaces,
  findSecretField,
  isSharedNamespace,
  isWebsiteLayoutNamespace,
} from './kv-ttl-cache-shared-namespaces';
import { INTEGRATION_NAMESPACES } from './kv-ttl-cache.testing';

describe('shared namespaces', () => {
  it.each(INTEGRATION_NAMESPACES)('keeps %s on the api replica', namespace => {
    expect(isSharedNamespace(namespace)).toBe(false);
  });

  it('keeps namespaces nobody listed on the api replica', () => {
    expect(isSharedNamespace('some-new-integration')).toBe(false);
  });

  it('shares page data, sessions and graphql responses', () => {
    expect(SHARED_NAMESPACES).toEqual(
      expect.arrayContaining([
        'auth:sessions',
        'settings',
        'navigations',
        'graphql:responses',
        'content:paywalls',
      ])
    );
  });

  it('shares the comments and polls every logged-in article view reads', () => {
    expect(SHARED_NAMESPACES).toEqual(
      expect.arrayContaining(['graphql:comments', 'content:polls'])
    );
  });

  it('refuses to share any integration settings namespace', () => {
    expect(() =>
      assertSharedNamespaces([...SHARED_NAMESPACES, 'settings:newprovider'])
    ).toThrow('settings:newprovider');
  });
});

describe('findSecretField', () => {
  it.each([
    [{ apiKey: 'sk_live_1' }, 'apiKey'],
    [{ provider: { api_key: 'x' } }, 'provider.api_key'],
    [{ webhookEndpointSecret: 'whsec' }, 'webhookEndpointSecret'],
    [{ credentials: { privateKey: 'pk' } }, 'credentials'],
    [{ password: 'x' }, 'password'],
    [{ token: 'session-token' }, 'token'],
    [[{ name: 'a' }, { accessToken: 'x' }], '1.accessToken'],
  ])('finds the secret in %j', (value, path) => {
    expect(findSecretField(value)).toBe(path);
  });

  it.each([
    [{ name: 'Main', links: [{ label: 'Token economy', url: '/a/x' }] }],
    [{ expiresAt: new Date(), roles: [{ permissions: ['CanGetArticle'] }] }],
    [null],
    ['apiKey'],
  ])('finds nothing in %j', value => {
    expect(findSecretField(value)).toBeUndefined();
  });
});

describe('website layout', () => {
  it.each(['navigations', 'settings', 'banners', 'content:paywalls'])(
    'counts %s as layout every page shows',
    namespace => {
      expect(isWebsiteLayoutNamespace(namespace)).toBe(true);
    }
  );

  it.each(['graphql:content', 'content:articles', 'content:images'])(
    'does not count %s as layout',
    namespace => {
      expect(isWebsiteLayoutNamespace(namespace)).toBe(false);
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
