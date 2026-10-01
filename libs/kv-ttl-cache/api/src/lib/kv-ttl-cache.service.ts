import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  Optional,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { randomBytes } from 'crypto';
import {
  KV_ATOMIC_STORE,
  KvAtomicStore,
  MemoryAtomicStore,
} from './kv-ttl-cache-atomic-store';
import {
  deserializeCacheValue,
  serializeCacheValue,
} from './kv-ttl-cache-serializer';
import {
  findSecretField,
  isSharedNamespace,
} from './kv-ttl-cache-shared-namespaces';

const VERSION_REFRESH_MS = 2000;
const RESYNC_INTERVAL_MS = 5000;
const REPLICAS_CAUGHT_UP_MS = 3000;
const MAX_SHARED_VALUE_CHARS = 256 * 1024;

const logger = new Logger('KvTtlCache');

const newVersion = () =>
  `${Date.now().toString(36)}${randomBytes(4).toString('hex')}`;

type KnownVersion = { version: string; checkedAt: number };

@Injectable()
export class KvTtlCacheService implements OnModuleDestroy {
  private inFlight = new Map<string, Promise<unknown>>();
  private nsVersionInFlight = new Map<string, Promise<string>>();
  private knownVersions = new Map<string, KnownVersion>();
  private unsyncedVersions = new Map<string, string>();
  private release = process.env['APP_RELEASE_ID'] || 'dev';
  private resyncTimer?: ReturnType<typeof setInterval>;
  private reportedSecrets = new Set<string>();

  constructor(
    @Inject(CACHE_MANAGER) private cache: Cache,
    @Optional()
    @Inject(KV_ATOMIC_STORE)
    private atomic: KvAtomicStore = new MemoryAtomicStore()
  ) {}

  private versionKey(namespace: string): string {
    return `nsv:${namespace}`;
  }

  private namespacedKey(
    namespace: string,
    version: string,
    key: string
  ): string {
    return `ns:${namespace}:v${version}:${key}`;
  }

  async getNamespaceVersion(namespace: string): Promise<string> {
    const vk = this.versionKey(namespace);
    const known = this.knownVersions.get(vk);

    if (known && Date.now() - known.checkedAt < VERSION_REFRESH_MS) {
      return known.version;
    }

    const existing = this.nsVersionInFlight.get(vk);
    if (existing) {
      return existing;
    }

    const p = (async () => {
      const unsynced = this.unsyncedVersions.get(vk);

      if (unsynced) {
        await this.resyncVersions();

        this.knownVersions.set(vk, {
          version: unsynced,
          checkedAt: Date.now(),
        });

        return unsynced;
      }

      const shared =
        (await this.atomic.getRaw(vk)) ??
        (await this.createSharedVersion(vk, known?.version));

      this.knownVersions.set(vk, { version: shared, checkedAt: Date.now() });

      return shared;
    })().finally(() => this.nsVersionInFlight.delete(vk));

    this.nsVersionInFlight.set(vk, p);
    return p;
  }

  private async createSharedVersion(
    vk: string,
    localVersion: string | undefined
  ): Promise<string> {
    const version = localVersion ?? newVersion();
    await this.atomic.setIfAbsent(vk, version);

    return (await this.atomic.getRaw(vk)) ?? version;
  }

  onModuleDestroy() {
    clearInterval(this.resyncTimer);
  }

  private async writeVersion(vk: string): Promise<void> {
    const version = newVersion();

    if (await this.atomic.setRaw(vk, version)) {
      this.unsyncedVersions.delete(vk);
    } else {
      this.unsyncedVersions.set(vk, version);
      this.resyncTimer ??= setInterval(
        () => void this.resyncVersions(),
        RESYNC_INTERVAL_MS
      );
      this.resyncTimer.unref?.();
    }

    this.knownVersions.set(vk, { version, checkedAt: Date.now() });
  }

  private async resyncVersions(): Promise<void> {
    const resynced: string[] = [];

    for (const [vk, version] of [...this.unsyncedVersions]) {
      if (await this.atomic.setRaw(vk, version)) {
        this.unsyncedVersions.delete(vk);
        resynced.push(vk);
      }
    }

    if (!this.unsyncedVersions.size) {
      clearInterval(this.resyncTimer);
      this.resyncTimer = undefined;
    }

    if (resynced.length) {
      setTimeout(() => {
        for (const vk of resynced) {
          void this.writeVersion(vk);
        }
      }, REPLICAS_CAUGHT_UP_MS).unref?.();
    }
  }

  async resetNamespace(namespace: string): Promise<void> {
    const vk = this.versionKey(namespace);
    await this.writeVersion(vk);

    for (const k of this.inFlight.keys()) {
      if (k.startsWith(`ns:${namespace}:`)) {
        this.inFlight.delete(k);
      }
    }
  }

  async getOrLoad<T>(
    key: string,
    loader: () => Promise<T> | T,
    ttlSeconds: number
  ): Promise<T> {
    const cached = await this.cache.get<T>(key);
    if (cached !== undefined && cached !== null) {
      return cached;
    }

    const existing = this.inFlight.get(key) as Promise<T> | undefined;
    if (existing) {
      return existing;
    }

    const p = (async () => {
      const value = await Promise.resolve(loader());
      await this.cache.set(key, value as any, ttlSeconds * 1000);
      return value;
    })().finally(() => {
      this.inFlight.delete(key);
    });

    this.inFlight.set(key, p as Promise<unknown>);

    return p;
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    await this.cache.set(
      key,
      value,
      ttlSeconds ? ttlSeconds * 1000 : undefined
    );
  }

  async get<T>(key: string): Promise<T | undefined> {
    return this.cache.get<T>(key);
  }

  async del(key: string): Promise<void> {
    await this.cache.del(key);
  }

  async getOrLoadNs<T>(
    namespace: string,
    key: string,
    loader: () => Promise<T> | T,
    ttlSeconds: number
  ): Promise<T> {
    const version = await this.getNamespaceVersion(namespace);
    const fullKey = this.namespacedKey(namespace, version, key);

    if (!this.isShared(namespace)) {
      return this.getOrLoad(fullKey, loader, ttlSeconds);
    }

    const cached = await this.readShared<T>(fullKey);
    if (cached !== undefined && cached !== null) {
      return cached;
    }

    const existing = this.inFlight.get(fullKey) as Promise<T> | undefined;
    if (existing) {
      return existing;
    }

    const p = (async () => {
      const value = await Promise.resolve(loader());
      await this.writeShared(namespace, fullKey, value, ttlSeconds);
      return value;
    })().finally(() => {
      this.inFlight.delete(fullKey);
    });

    this.inFlight.set(fullKey, p as Promise<unknown>);

    return p;
  }

  async getOrLoadManyNs<T>(
    namespace: string,
    keys: string[],
    loader: (missing: string[]) => Promise<Array<T | null>>,
    ttlSeconds: number,
    keyPrefix = ''
  ): Promise<Array<T | null>> {
    const cached = await this.getManyNs<T>(
      namespace,
      keys.map(key => `${keyPrefix}${key}`)
    );
    const missing = keys.filter(
      (_, index) => cached[index] === undefined || cached[index] === null
    );

    if (!missing.length) {
      return cached as T[];
    }

    const loaded = await loader(missing);
    const loadedByKey = new Map(
      missing.map((key, index) => [key, loaded[index] ?? null])
    );

    await Promise.all(
      [...loadedByKey].map(([key, value]) =>
        value === null ? undefined : (
          this.setNs(namespace, `${keyPrefix}${key}`, value, ttlSeconds)
        )
      )
    );

    return keys.map(
      (key, index) => cached[index] ?? loadedByKey.get(key) ?? null
    );
  }

  private async getManyNs<T>(
    namespace: string,
    keys: string[]
  ): Promise<Array<T | undefined>> {
    if (!this.isShared(namespace)) {
      return Promise.all(keys.map(key => this.getNs<T>(namespace, key)));
    }

    const version = await this.getNamespaceVersion(namespace);
    const fullKeys = keys.map(key =>
      this.namespacedKey(namespace, version, key)
    );
    const values = await Promise.all(
      fullKeys.map(fullKey => this.cache.get<T>(fullKey))
    );
    const remote = fullKeys.filter(
      (_, index) => values[index] === undefined || values[index] === null
    );

    if (!remote.length) {
      return values;
    }

    const texts = await this.atomic.getManyRaw(
      remote.map(fullKey => this.sharedKey(fullKey))
    );
    const remoteValues = new Map<string, T>();

    await Promise.all(
      remote.map(async (fullKey, index) => {
        const text = texts[index];

        if (text === undefined) {
          return;
        }

        const value = deserializeCacheValue<T>(text);
        remoteValues.set(fullKey, value);
        await this.cache.set(fullKey, value as any, VERSION_REFRESH_MS);
      })
    );

    return fullKeys.map(
      (fullKey, index) => values[index] ?? remoteValues.get(fullKey)
    );
  }

  async setNs<T>(
    namespace: string,
    key: string,
    value: T,
    ttlSeconds?: number
  ): Promise<void> {
    const version = await this.getNamespaceVersion(namespace);
    const fullKey = this.namespacedKey(namespace, version, key);

    if (this.isShared(namespace) && ttlSeconds) {
      return this.writeShared(namespace, fullKey, value, ttlSeconds);
    }

    await this.set(fullKey, value, ttlSeconds);
  }

  async getNs<T>(namespace: string, key: string): Promise<T | undefined> {
    const version = await this.getNamespaceVersion(namespace);
    const fullKey = this.namespacedKey(namespace, version, key);

    if (this.isShared(namespace)) {
      return this.readShared<T>(fullKey);
    }

    return this.get<T>(fullKey);
  }

  async delNs(namespace: string, key: string): Promise<void> {
    const version = await this.getNamespaceVersion(namespace);
    const fullKey = this.namespacedKey(namespace, version, key);
    await this.del(fullKey);

    if (this.isShared(namespace)) {
      await this.atomic.delRaw(this.sharedKey(fullKey));
    }
  }

  private isShared(namespace: string): boolean {
    return this.atomic.shared && isSharedNamespace(namespace);
  }

  private sharedKey(fullKey: string): string {
    return `val:${this.release}:${fullKey}`;
  }

  private async readShared<T>(fullKey: string): Promise<T | undefined> {
    const local = await this.cache.get<T>(fullKey);
    if (local !== undefined && local !== null) {
      return local;
    }

    const text = await this.atomic.getRaw(this.sharedKey(fullKey));
    if (text === undefined) {
      return undefined;
    }

    const value = deserializeCacheValue<T>(text);
    await this.cache.set(fullKey, value as any, VERSION_REFRESH_MS);

    return value;
  }

  private async writeShared<T>(
    namespace: string,
    fullKey: string,
    value: T,
    ttlSeconds: number
  ): Promise<void> {
    const ttlMs = ttlSeconds * 1000;
    const text = serializeCacheValue(value);
    const secret = findSecretField(value);

    if (secret && !this.reportedSecrets.has(namespace)) {
      this.reportedSecrets.add(namespace);
      logger.error(
        `Not storing ${namespace} in Dragonfly, it contains the field ${secret}`
      );
    }

    const shareable =
      !secret &&
      value !== null &&
      typeof text === 'string' &&
      text.length <= MAX_SHARED_VALUE_CHARS &&
      this.atomic.isAvailable();

    if (shareable) {
      await this.atomic.setRaw(this.sharedKey(fullKey), text, ttlMs);
    }

    const shared = shareable && this.atomic.isAvailable();

    await this.cache.set(
      fullKey,
      value as any,
      shared ? Math.min(VERSION_REFRESH_MS, ttlMs) : ttlMs
    );
  }
}
