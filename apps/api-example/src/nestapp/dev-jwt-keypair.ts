import { generateKeyPairSync } from 'crypto';

export interface JwtKeyPairConfig {
  get(key: string): string | undefined;
}

export interface JwtKeyPair {
  privateKey: string;
  publicKey: string;
}

let developmentJwtKeyPair: JwtKeyPair | undefined;

const readPem = (value: string | undefined): string =>
  (value ?? '').replace(/\\n/g, '\n');

const createDevelopmentJwtKeyPair = (): JwtKeyPair => {
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');

  return {
    privateKey: privateKey.export({ format: 'pem', type: 'pkcs8' }).toString(),
    publicKey: publicKey.export({ format: 'pem', type: 'spki' }).toString(),
  };
};

/**
 * Resolves the Ed25519 JWT key pair used by the API and media service.
 *
 * Production requires explicit keys from secret-managed environment variables.
 * Development may omit both keys; in that case a process-local key pair is
 * generated so local Docker and test runs do not require committed PEM files.
 */
export const resolveJwtKeyPair = (config: JwtKeyPairConfig): JwtKeyPair => {
  const privateKey = readPem(config.get('JWT_PRIVATE_KEY'));
  const publicKey = readPem(config.get('JWT_PUBLIC_KEY'));

  if (privateKey && publicKey) {
    return { privateKey, publicKey };
  }

  if (privateKey || publicKey) {
    throw new Error(
      'JWT_PRIVATE_KEY and JWT_PUBLIC_KEY must be configured together'
    );
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'JWT_PRIVATE_KEY and JWT_PUBLIC_KEY must be configured in production'
    );
  }

  developmentJwtKeyPair ??= createDevelopmentJwtKeyPair();

  return developmentJwtKeyPair;
};
