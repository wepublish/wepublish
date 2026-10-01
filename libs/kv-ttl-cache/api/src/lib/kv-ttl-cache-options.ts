import { createKeyvNonBlocking } from '@keyv/redis';
import { Logger } from '@nestjs/common';
import type { CreateCacheOptions } from 'cache-manager';
import {
  deserializeCacheValue,
  serializeCacheValue,
} from './kv-ttl-cache-serializer';

const DEFAULT_TTL_MS = 600000;
const CONNECTION_TIMEOUT_MS = 1000;

const logger = new Logger('KvTtlCache');

export type KvTtlCacheEnv = {
  REDIS_URL?: string;
  REDIS_KEY_PREFIX?: string;
};

export function createKvTtlCacheOptions(
  env: KvTtlCacheEnv = process.env
): CreateCacheOptions {
  if (!env.REDIS_URL) {
    return { ttl: DEFAULT_TTL_MS };
  }

  if (!env.REDIS_KEY_PREFIX) {
    throw new Error('REDIS_KEY_PREFIX must be set when REDIS_URL is set');
  }

  const store = createKeyvNonBlocking(
    {
      url: env.REDIS_URL,
      socket: {
        reconnectStrategy: false,
        connectTimeout: CONNECTION_TIMEOUT_MS,
      },
    },
    {
      namespace: env.REDIS_KEY_PREFIX,
      connectionTimeout: CONNECTION_TIMEOUT_MS,
    }
  );
  store.serialize = serializeCacheValue;
  store.deserialize = deserializeCacheValue;
  store.on('error', (error: unknown) => {
    logger.error(
      `Dragonfly cache unavailable, falling back to the loader: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  });

  return { ttl: DEFAULT_TTL_MS, stores: [store] };
}
