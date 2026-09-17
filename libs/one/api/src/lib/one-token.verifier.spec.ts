import { createPublicKey, generateKeyPairSync } from 'crypto';
import { SignJWT, importJWK, importPKCS8, type JWK } from 'jose';
import { OneJwksClientService } from './one-jwks-client.service';
import { OneTokenVerifier } from './one-token.verifier';

const ONE_URL = 'https://one.wepublish.ch';
const HOST_URL = 'https://api.medium-a.ch';
const OTHER_HOST_URL = 'https://api.medium-b.ch';

const { publicKey, privateKey } = generateKeyPairSync('ed25519', {
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

async function sign({
  scope = 'read:content',
  issuer = ONE_URL,
  audience = HOST_URL,
  expiresIn = '2m',
}: {
  scope?: string;
  issuer?: string;
  audience?: string;
  expiresIn?: string;
} = {}) {
  const key = await importPKCS8(privateKey as string, 'EdDSA');

  return new SignJWT({ scope })
    .setProtectedHeader({ alg: 'EdDSA', kid: 'one-kid' })
    .setSubject('wepublish-one')
    .setIssuer(issuer)
    .setAudience(audience)
    .setExpirationTime(expiresIn)
    .sign(key);
}

describe('OneTokenVerifier', () => {
  let verifier: OneTokenVerifier;

  beforeEach(() => {
    const jwk = createPublicKey({
      key: publicKey as string,
      format: 'pem',
    }).export({ format: 'jwk' });

    const jwks = {
      getKey: jest
        .fn()
        .mockImplementation(() => importJWK(jwk as JWK, 'EdDSA')),
    } as unknown as OneJwksClientService;

    verifier = new OneTokenVerifier(jwks, ONE_URL, HOST_URL);
  });

  it('accepts a correctly scoped token addressed to this medium', async () => {
    await expect(
      verifier.verifyScopedJWT(await sign(), 'read:content')
    ).resolves.toBe(true);
  });

  it('rejects a token addressed to a different medium', async () => {
    const token = await sign({ audience: OTHER_HOST_URL });

    await expect(verifier.verifyScopedJWT(token, 'read:content')).resolves.toBe(
      false
    );
  });

  it('rejects a token from an unexpected issuer', async () => {
    const token = await sign({ issuer: 'https://evil.example.com' });

    await expect(verifier.verifyScopedJWT(token, 'read:content')).resolves.toBe(
      false
    );
  });

  it('rejects a token carrying the wrong scope', async () => {
    const token = await sign({ scope: 'write:settings' });

    await expect(verifier.verifyScopedJWT(token, 'read:content')).resolves.toBe(
      false
    );
  });

  it('rejects an expired token', async () => {
    const token = await sign({ expiresIn: '-5m' });

    await expect(verifier.verifyScopedJWT(token, 'read:content')).resolves.toBe(
      false
    );
  });

  it('rejects a malformed token', async () => {
    await expect(
      verifier.verifyScopedJWT('not-a-jwt', 'read:content')
    ).resolves.toBe(false);
  });

  it('rejects everything when WEP_ONE_URL is not configured', async () => {
    const jwk = createPublicKey({
      key: publicKey as string,
      format: 'pem',
    }).export({ format: 'jwk' });
    const jwks = {
      getKey: jest
        .fn()
        .mockImplementation(() => importJWK(jwk as JWK, 'EdDSA')),
    } as unknown as OneJwksClientService;
    const unconfigured = new OneTokenVerifier(jwks, '', HOST_URL);

    await expect(
      unconfigured.verifyScopedJWT(await sign(), 'read:content')
    ).resolves.toBe(false);
  });
});
