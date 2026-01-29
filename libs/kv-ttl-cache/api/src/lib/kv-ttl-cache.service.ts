import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class KvTtlCacheService {
  private readonly inFlight = new Map<string, Promise<unknown>>();

  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

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
    if (existing) return existing;

    const p = (async () => {
      const value = await Promise.resolve(loader());

      await this.cache.set(key, value as any, ttlSeconds);

      return value;
    })().finally(() => {
      this.inFlight.delete(key);
    });

    this.inFlight.set(key, p as Promise<unknown>);
    return p;
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    await this.cache.set(key, value as any, ttlSeconds);
  }

  async get<T>(key: string): Promise<T | undefined> {
    return this.cache.get<T>(key) ?? undefined;
  }

  async del(key: string): Promise<void> {
    await this.cache.del(key);
  }
}
