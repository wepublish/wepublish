import {
  SHARED_NAMESPACES,
  assertSharedNamespaces,
  findSecretField,
  isSharedNamespace,
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
