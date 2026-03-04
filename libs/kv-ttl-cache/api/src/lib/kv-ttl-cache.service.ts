import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class KvTtlCacheService {
  private inFlight = new Map<string, Promise<unknown>>();
  private nsVersionInFlight = new Map<string, Promise<string>>();

  constructor(@Inject(CACHE_MANAGER) private cache: Cache) {}

  private versionKey(namespace: string): string {
    return `ns:${namespace}:version`;
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

    const cached = await this.cache.get<string>(vk);
    if (cached) {
      return cached;
    }

    const existing = this.nsVersionInFlight.get(vk);
    if (existing) {
      return existing;
    }

    const p = (async () => {
      const version = Date.now().toString(36);
      await this.cache.set(vk, version);

      return version;
    })().finally(() => this.nsVersionInFlight.delete(vk));

    this.nsVersionInFlight.set(vk, p);
    return p;
  }

  async resetNamespace(namespace: string): Promise<void> {
    const vk = this.versionKey(namespace);
    const newVersion = Date.now().toString(36);
    await this.cache.set(vk, newVersion);

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

    return this.getOrLoad(fullKey, loader, ttlSeconds);
  }

  async setNs<T>(
    namespace: string,
    key: string,
    value: T,
    ttlSeconds?: number
  ): Promise<void> {
    const version = await this.getNamespaceVersion(namespace);
    const fullKey = this.namespacedKey(namespace, version, key);
    await this.set(fullKey, value, ttlSeconds);
  }

  async getNs<T>(namespace: string, key: string): Promise<T | undefined> {
    const version = await this.getNamespaceVersion(namespace);
    const fullKey = this.namespacedKey(namespace, version, key);

    return this.get<T>(fullKey);
  }

  async delNs(namespace: string, key: string): Promise<void> {
    const version = await this.getNamespaceVersion(namespace);
    const fullKey = this.namespacedKey(namespace, version, key);
    await this.del(fullKey);
  }
}
