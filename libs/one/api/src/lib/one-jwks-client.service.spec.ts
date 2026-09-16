import { createPublicKey, generateKeyPairSync } from 'crypto';
import { OneJwksClientService } from './one-jwks-client.service';

function makeJwk(kid: string) {
  const { publicKey } = generateKeyPairSync('ed25519', {
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  const jwk = createPublicKey({
    key: publicKey as string,
    format: 'pem',
  }).export({ format: 'jwk' });

  return { ...jwk, kid, use: 'sig', alg: 'EdDSA' };
}

describe('OneJwksClientService', () => {
  const first = makeJwk('kid-one');
  const second = makeJwk('kid-two');
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({ keys: [first, second] }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it('fetches the JWKS from the channel path', async () => {
    const service = new OneJwksClientService('https://one.wepublish.ch');
    await service.getKey('kid-one');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://one.wepublish.ch/channel/jwks.json'
    );
  });

  it('selects the key matching the requested kid', async () => {
    const service = new OneJwksClientService('https://one.wepublish.ch');

    const keyOne = await service.getKey('kid-one');
    const keyTwo = await service.getKey('kid-two');

    expect(keyOne).not.toBe(keyTwo);
  });

  it('serves a cached key when a later refresh fails', async () => {
    const service = new OneJwksClientService('https://one.wepublish.ch');
    const cached = await service.getKey('kid-one');

    fetchMock.mockRejectedValue(new Error('network down'));
    const again = await service.getKey('kid-unknown');

    expect(again).toBe(cached);
  });

  it('throws when the fetch fails and nothing is cached', async () => {
    fetchMock.mockRejectedValue(new Error('network down'));
    const service = new OneJwksClientService('https://one.wepublish.ch');

    await expect(service.getKey('kid-one')).rejects.toThrow('network down');
  });
});
