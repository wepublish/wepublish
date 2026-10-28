import { Injectable } from '@nestjs/common';
import { type CacheLookup, traceCacheGet } from '../kv-ttl-cache-tracing';
import {
  CatchUpScheduler,
  REPLICAS_CAUGHT_UP_MS,
} from '../versions/catch-up-scheduler';
import { NamespaceVersions } from '../versions/namespace-versions';
import { OutagePeriod } from '../versions/outage-period';
import { LoadCoordinator } from './load-coordinator';
import { NamespaceCaches } from './namespace-caches';
import { NamespacedCache } from './namespaced-cache';

const isCached = <T>(value: T | null | undefined): value is T =>
  value !== undefined && value !== null;

const toTtlMs = (ttlSeconds: number) => {
  if (!Number.isFinite(ttlSeconds) || ttlSeconds <= 0) {
    throw new RangeError(
      `ttlSeconds must be a positive number of seconds, got ${ttlSeconds}`
    );
  }

  return ttlSeconds * 1000;
};

@Injectable()
export class VersionedCache extends NamespacedCache {
  constructor(
    private readonly versions: NamespaceVersions,
    private readonly caches: NamespaceCaches,
    private readonly outage: OutagePeriod,
    private readonly coordinator: LoadCoordinator,
    private readonly catchUp: CatchUpScheduler
  ) {
    super();
  }

  getOrLoadNs<T>(
    namespace: string,
    key: string,
    loader: () => Promise<T> | T,
    ttlSeconds: number
  ): Promise<T> {
    return traceCacheGet(namespace, () =>
      this.lookupNs(namespace, key, loader, ttlSeconds)
    );
  }

  getOrLoadManyNs<T>(
    namespace: string,
    keys: string[],
    loader: (missing: string[]) => Promise<Array<T | null>>,
    ttlSeconds: number,
    keyPrefix = ''
  ): Promise<Array<T | null>> {
    return traceCacheGet(namespace, () =>
      this.lookupManyNs(namespace, keys, loader, ttlSeconds, keyPrefix)
    );
  }

  private async lookupNs<T>(
    namespace: string,
    key: string,
    loader: () => Promise<T> | T,
    ttlSeconds: number
  ): Promise<CacheLookup<T>> {
    const ttlMs = toTtlMs(ttlSeconds);
    const cache = this.caches.cacheFor(namespace);
    const fullKey = this.fullKey(
      namespace,
      await this.localVersion(namespace),
      key
    );
    const cached = await cache.get<T>(fullKey);

    if (isCached(cached)) {
      return { value: cached, hit: true };
    }

    const value = await this.coordinator.load(
      fullKey,
      async () => loader(),
      async loaded => {
        if (isCached(loaded)) {
          await cache.set(fullKey, loaded, ttlMs);
        }
      }
    );

    return { value, hit: false };
  }

  private async lookupManyNs<T>(
    namespace: string,
    keys: string[],
    loader: (missing: string[]) => Promise<Array<T | null>>,
    ttlSeconds: number,
    keyPrefix = ''
  ): Promise<CacheLookup<Array<T | null>>> {
    const ttlMs = toTtlMs(ttlSeconds);
    const cache = this.caches.cacheFor(namespace);
    const version = await this.localVersion(namespace);
    const fullKeys = keys.map(key =>
      this.fullKey(namespace, version, `${keyPrefix}${key}`)
    );
    const cached: Array<T | null | undefined> =
      fullKeys.length ? await cache.mget<T>(fullKeys) : [];
    const missing = keys
      .map((key, index) => ({ fullKey: fullKeys[index], key }))
      .filter((_, index) => !isCached(cached[index]));

    if (!missing.length) {
      return {
        value: cached as T[],
        hit: true,
        keys: keys.length,
        misses: 0,
      };
    }

    const loaded = await this.coordinator.loadMany<T>(
      missing,
      loader,
      async (fullKey, value) => {
        await cache.set(fullKey, value, ttlMs);
      }
    );
    const loadedByKey = new Map(
      missing.map(({ fullKey }, index) => [fullKey, loaded[index]])
    );

    return {
      value: fullKeys.map(
        (fullKey, index) => cached[index] ?? loadedByKey.get(fullKey) ?? null
      ),
      hit: false,
      keys: keys.length,
      misses: missing.length,
    };
  }

  async getNs<T>(namespace: string, key: string): Promise<T | undefined> {
    const fullKey = this.fullKey(
      namespace,
      await this.localVersion(namespace),
      key
    );
    const cached = await this.caches.cacheFor(namespace).get<T>(fullKey);

    return isCached(cached) ? cached : undefined;
  }

  async setNs<T>(
    namespace: string,
    key: string,
    value: T,
    ttlSeconds: number
  ): Promise<void> {
    const ttlMs = toTtlMs(ttlSeconds);

    if (!isCached(value)) {
      return;
    }

    const fullKey = this.fullKey(
      namespace,
      await this.localVersion(namespace),
      key
    );

    await this.caches.cacheFor(namespace).set(fullKey, value, ttlMs);
  }

  async delNs(namespace: string, key: string): Promise<void> {
    await this.deleteUnder(namespace, key, await this.versionsOf(namespace));

    if (!this.caches.isShared(namespace)) {
      return;
    }

    this.catchUp.after(REPLICAS_CAUGHT_UP_MS, async () =>
      this.deleteUnder(namespace, key, await this.versionsOf(namespace))
    );
  }

  private fullKey(namespace: string, version: string, key: string): string {
    return `ns:${namespace}:v${version}:${key}`;
  }

  private async localVersion(namespace: string): Promise<string> {
    const version = await this.versions.current(namespace);

    return this.caches.isShared(namespace) ?
        version
      : `${version}${this.outage.suffix()}`;
  }

  private async versionsOf(namespace: string): Promise<string[]> {
    const versions = new Set([await this.localVersion(namespace)]);

    if (this.caches.isShared(namespace)) {
      const shared = await this.versions.peekShared(namespace);

      if (shared) {
        versions.add(shared);
      }
    }

    return [...versions];
  }

  private async deleteUnder(
    namespace: string,
    key: string,
    versions: string[]
  ): Promise<void> {
    const fullKeys = versions.map(version =>
      this.fullKey(namespace, version, key)
    );

    this.coordinator.supersede(fullKeys);
    await this.caches.cacheFor(namespace).mdel(fullKeys);
  }
}
