import { Inject, Module, OnModuleDestroy } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { createCache, type Cache } from 'cache-manager';
import { KvTtlCacheService } from './kv-ttl-cache.service';
import { createKvTtlCacheOptions } from './kv-ttl-cache-options';
import {
  createKvAtomicStore,
  KV_ATOMIC_STORE,
  type KvAtomicStore,
} from './kv-ttl-cache-atomic-store';

@Module({
  providers: [
    {
      provide: CACHE_MANAGER,
      useFactory: () => createCache(createKvTtlCacheOptions()),
    },
    {
      provide: KV_ATOMIC_STORE,
      useFactory: () => createKvAtomicStore(),
    },
    KvTtlCacheService,
  ],
  exports: [KvTtlCacheService],
})
export class KvTtlCacheModule implements OnModuleDestroy {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    @Inject(KV_ATOMIC_STORE) private readonly atomic: KvAtomicStore
  ) {}

  async onModuleDestroy() {
    await Promise.all([this.cache.disconnect(), this.atomic.disconnect()]);
  }
}
