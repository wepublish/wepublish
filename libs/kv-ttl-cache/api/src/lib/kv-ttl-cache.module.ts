import { Inject, Module, OnModuleDestroy } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { createCache, type Cache } from 'cache-manager';
import { KvTtlCacheService } from './kv-ttl-cache.service';
import { createKvTtlCacheOptions } from './kv-ttl-cache-options';

@Module({
  providers: [
    {
      provide: CACHE_MANAGER,
      useFactory: () => createCache(createKvTtlCacheOptions()),
    },
    KvTtlCacheService,
  ],
  exports: [KvTtlCacheService],
})
export class KvTtlCacheModule implements OnModuleDestroy {
  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  async onModuleDestroy() {
    await this.cache.disconnect();
  }
}
