import KeyvRedis, {
  createKeyvNonBlocking,
  type RedisClientType,
} from '@keyv/redis';
import { Logger } from '@nestjs/common';
import { readFileSync } from 'fs';

export const KV_ATOMIC_STORE = Symbol('KV_ATOMIC_STORE');

const CONNECTION_TIMEOUT_MS = 1000;
const UNAVAILABLE_RETRY_MS = 5000;

const logger = new Logger('KvTtlCache');

export type KvTtlCacheEnv = {
  NODE_ENV?: string;
  REDIS_URL?: string;
  REDIS_KEY_PREFIX?: string;
  NODE_EXTRA_CA_CERTS?: string;
};

export interface KvAtomicStore {
  readonly shared: boolean;
  isAvailable(): boolean;
  setIfAbsent(key: string, value: string, ttlMs?: number): Promise<boolean>;
  getRaw(key: string): Promise<string | undefined>;
  setRaw(key: string, value: string, ttlMs?: number): Promise<void>;
  delRaw(key: string): Promise<void>;
  disconnect(): Promise<void>;
}

type MemoryEntry = { value: string; expiresAt?: number };

export class MemoryAtomicStore implements KvAtomicStore {
  readonly shared: boolean = false;
  private entries = new Map<string, MemoryEntry>();

  isAvailable() {
    return true;
  }

  async setIfAbsent(key: string, value: string, ttlMs?: number) {
    if (this.read(key) !== undefined) {
      return false;
    }

    this.write(key, value, ttlMs);

    return true;
  }

  async getRaw(key: string) {
    return this.read(key);
  }

  async setRaw(key: string, value: string, ttlMs?: number) {
    this.write(key, value, ttlMs);
  }

  async delRaw(key: string) {
    this.entries.delete(key);
  }

  async disconnect() {
    this.entries.clear();
  }

  private read(key: string) {
    const entry = this.entries.get(key);

    if (entry?.expiresAt !== undefined && entry.expiresAt <= Date.now()) {
      this.entries.delete(key);

      return undefined;
    }

    return entry?.value;
  }

  private write(key: string, value: string, ttlMs?: number) {
    this.entries.set(key, {
      value,
      expiresAt: ttlMs ? Date.now() + ttlMs : undefined,
    });
  }
}

export class DragonflyAtomicStore implements KvAtomicStore {
  readonly shared = true;
  private unavailableUntil = 0;

  constructor(readonly adapter: KeyvRedis<unknown>) {}

  isAvailable() {
    return Date.now() >= this.unavailableUntil;
  }

  async setIfAbsent(key: string, value: string, ttlMs?: number) {
    const reply = await this.send([
      'SET',
      this.key(key),
      value,
      'NX',
      ...(ttlMs ? ['PX', String(ttlMs)] : []),
    ]);

    return reply === undefined || reply === 'OK';
  }

  async getRaw(key: string) {
    const reply = await this.send(['GET', this.key(key)]);

    return typeof reply === 'string' ? reply : undefined;
  }

  async setRaw(key: string, value: string, ttlMs?: number) {
    await this.send([
      'SET',
      this.key(key),
      value,
      ...(ttlMs ? ['PX', String(ttlMs)] : []),
    ]);
  }

  async delRaw(key: string) {
    await this.send(['DEL', this.key(key)]);
  }

  async disconnect() {
    await this.adapter.disconnect();
  }

  private key(key: string) {
    return this.adapter.createKeyPrefix(key, this.adapter.namespace);
  }

  private async send(command: string[]): Promise<unknown> {
    if (!this.isAvailable()) {
      return undefined;
    }

    try {
      const client = (await this.adapter.getClient()) as RedisClientType;

      return (await client.sendCommand(command)) ?? null;
    } catch (error) {
      this.unavailableUntil = Date.now() + UNAVAILABLE_RETRY_MS;
      logger.error(
        `Dragonfly unavailable, caching on this replica only for the next ${
          UNAVAILABLE_RETRY_MS / 1000
        } s: ${error instanceof Error ? error.message : String(error)}`
      );

      return undefined;
    }
  }
}

const tlsOptions = (env: KvTtlCacheEnv, url: URL) => {
  const production = env.NODE_ENV === 'production';

  if (production && url.protocol !== 'rediss:') {
    throw new Error('REDIS_URL must use rediss:// in production');
  }

  if (url.protocol !== 'rediss:') {
    return {};
  }

  if (!env.NODE_EXTRA_CA_CERTS) {
    if (production) {
      throw new Error(
        'NODE_EXTRA_CA_CERTS must point to the internal CA to verify Dragonfly in production'
      );
    }

    return { tls: true as const, rejectUnauthorized: true };
  }

  let ca: string;

  try {
    ca = readFileSync(env.NODE_EXTRA_CA_CERTS, 'utf8');
  } catch {
    throw new Error(
      `Cannot read the CA to verify Dragonfly from ${env.NODE_EXTRA_CA_CERTS}`
    );
  }

  return { tls: true as const, rejectUnauthorized: true, ca };
};

export function createKvAtomicStore(
  env: KvTtlCacheEnv = process.env
): KvAtomicStore {
  if (!env.REDIS_URL) {
    return new MemoryAtomicStore();
  }

  if (!env.REDIS_KEY_PREFIX) {
    throw new Error('REDIS_KEY_PREFIX must be set when REDIS_URL is set');
  }

  const keyv = createKeyvNonBlocking(
    {
      url: env.REDIS_URL,
      socket: {
        reconnectStrategy: false,
        connectTimeout: CONNECTION_TIMEOUT_MS,
        ...tlsOptions(env, new URL(env.REDIS_URL)),
      },
    },
    {
      namespace: env.REDIS_KEY_PREFIX,
      connectionTimeout: CONNECTION_TIMEOUT_MS,
    }
  );

  keyv.on('error', (error: unknown) => {
    logger.error(
      `Dragonfly unavailable, caching on this replica only: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  });

  return new DragonflyAtomicStore(keyv.store as KeyvRedis<unknown>);
}
