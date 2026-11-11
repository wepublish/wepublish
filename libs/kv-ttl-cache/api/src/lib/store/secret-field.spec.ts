import { findSecretField } from './secret-field';

describe('findSecretField', () => {
  it.each([
    [{ apiKey: 'sk_live_1' }, 'apiKey'],
    [{ provider: { api_key: 'x' } }, 'provider.api_key'],
    [{ webhookEndpointSecret: 'whsec' }, 'webhookEndpointSecret'],
    [{ credentials: { privateKey: 'pk' } }, 'credentials'],
    [{ password: 'x' }, 'password'],
    [{ token: 'session-token' }, 'token'],
    [[{ name: 'a' }, { accessToken: 'x' }], '1.accessToken'],
    [{ peer: { token: 'peer-secret' } }, 'peer.token'],
    [{ paywall: { token: 'x' } }, 'paywall.token'],
  ])('finds the secret in %j', (value, path) => {
    expect(findSecretField(value)).toBe(path);
  });

  it.each([
    [{ name: 'Main', links: [{ label: 'Token economy', url: '/a/x' }] }],
    [{ expiresAt: new Date(), roles: [{ permissions: ['CanGetArticle'] }] }],
    [null],
    ['apiKey'],
    [
      {
        article: {
          paywall: { bypasses: [{ id: 'b1', token: 'public-bypass' }] },
        },
      },
    ],
    [{ peer: { token: '' } }],
    [{ apiKey: null, password: '' }],
  ])('finds nothing in %j', value => {
    expect(findSecretField(value)).toBeUndefined();
  });
});
