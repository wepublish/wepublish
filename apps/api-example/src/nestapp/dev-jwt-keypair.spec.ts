import { generateKeyPairSync } from 'crypto';
import { importPKCS8, importSPKI } from 'jose';
import { resolveJwtKeyPair } from './dev-jwt-keypair';

const createPemPair = () => {
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');

  return {
    privateKey: privateKey.export({ format: 'pem', type: 'pkcs8' }).toString(),
    publicKey: publicKey.export({ format: 'pem', type: 'spki' }).toString(),
  };
};

const configFrom = (values: Record<string, string | undefined>) => ({
  get: (key: string) => values[key],
});

describe('resolveJwtKeyPair', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('returns configured keys with escaped newlines restored', async () => {
    const pair = createPemPair();
    const resolved = resolveJwtKeyPair(
      configFrom({
        JWT_PRIVATE_KEY: pair.privateKey.replace(/\n/g, '\\n'),
        JWT_PUBLIC_KEY: pair.publicKey.replace(/\n/g, '\\n'),
      })
    );

    expect(resolved).toEqual(pair);
    await expect(
      importPKCS8(resolved.privateKey, 'EdDSA')
    ).resolves.toBeTruthy();
    await expect(importSPKI(resolved.publicKey, 'EdDSA')).resolves.toBeTruthy();
  });

  it('generates an importable development key pair when both keys are omitted', async () => {
    process.env.NODE_ENV = 'development';

    const first = resolveJwtKeyPair(configFrom({}));
    const second = resolveJwtKeyPair(configFrom({}));

    expect(second).toEqual(first);
    await expect(importPKCS8(first.privateKey, 'EdDSA')).resolves.toBeTruthy();
    await expect(importSPKI(first.publicKey, 'EdDSA')).resolves.toBeTruthy();
  });

  it('rejects partial JWT key configuration', () => {
    const pair = createPemPair();

    expect(() =>
      resolveJwtKeyPair(configFrom({ JWT_PRIVATE_KEY: pair.privateKey }))
    ).toThrow('JWT_PRIVATE_KEY and JWT_PUBLIC_KEY must be configured together');
  });

  it('requires explicit JWT keys in production', () => {
    process.env.NODE_ENV = 'production';

    expect(() => resolveJwtKeyPair(configFrom({}))).toThrow(
      'JWT_PRIVATE_KEY and JWT_PUBLIC_KEY must be configured in production'
    );
  });
});
