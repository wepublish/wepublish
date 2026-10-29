import { readFileSync } from 'fs';

export type DragonflyOptions = {
  production: boolean;
  releaseId: string;
} & (
  | { url: string; keyPrefix: string; ca?: string }
  | { url?: undefined; keyPrefix?: string; ca?: undefined }
);

export type DragonflyEnv = Partial<
  Record<
    | 'REDIS_URL'
    | 'REDIS_KEY_PREFIX'
    | 'NODE_ENV'
    | 'NODE_EXTRA_CA_CERTS'
    | 'APP_RELEASE_ID',
    string
  >
>;

export const DRAGONFLY_OPTIONS = Symbol('DRAGONFLY_OPTIONS');
export const RELEASE_ID = Symbol('RELEASE_ID');
export const DEV_RELEASE_ID = 'dev';

const readCa = (env: DragonflyEnv, url: URL, production: boolean) => {
  if (production && url.protocol !== 'rediss:') {
    throw new Error('REDIS_URL must use rediss:// in production');
  }

  if (url.protocol !== 'rediss:') {
    return undefined;
  }

  if (!env.NODE_EXTRA_CA_CERTS) {
    if (production) {
      throw new Error(
        'NODE_EXTRA_CA_CERTS must point to the internal CA to verify Dragonfly in production'
      );
    }

    return undefined;
  }

  try {
    return readFileSync(env.NODE_EXTRA_CA_CERTS, 'utf8');
  } catch {
    throw new Error(
      `Cannot read the CA to verify Dragonfly from ${env.NODE_EXTRA_CA_CERTS}`
    );
  }
};

export function dragonflyOptionsFromEnv(env: DragonflyEnv): DragonflyOptions {
  const production = env.NODE_ENV === 'production';
  const releaseId = env.APP_RELEASE_ID || DEV_RELEASE_ID;

  if (!env.REDIS_URL) {
    return {
      url: undefined,
      keyPrefix: undefined,
      production,
      ca: undefined,
      releaseId,
    };
  }

  if (!env.REDIS_KEY_PREFIX) {
    throw new Error('REDIS_KEY_PREFIX must be set when REDIS_URL is set');
  }

  return {
    url: env.REDIS_URL,
    keyPrefix: env.REDIS_KEY_PREFIX,
    production,
    ca: readCa(env, new URL(env.REDIS_URL), production),
    releaseId,
  };
}
