import {
  Inject,
  Logger,
  Module,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { createCache, type Cache } from 'cache-manager';
import {
  KvTtlCacheService,
  HEALTH_PROBE_KEY,
  HEALTH_PROBE_TTL_MS,
} from './kv-ttl-cache.service';
import { createKvTtlCacheOptions } from './kv-ttl-cache-options';
import {
  createKvAtomicStore,
  KV_ATOMIC_STORE,
  type KvAtomicStore,
} from './kv-ttl-cache-atomic-store';

const logger = new Logger('KvTtlCache');

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
export class KvTtlCacheModule implements OnModuleInit, OnModuleDestroy {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    @Inject(KV_ATOMIC_STORE) private readonly atomic: KvAtomicStore,
    @Inject(KvTtlCacheService) private readonly kv: KvTtlCacheService
  ) {}

  async onModuleInit() {
    if (process.env['NODE_ENV'] === 'production' && !process.env['REDIS_URL']) {
      logger.warn(
        'REDIS_URL is not set: caches and their resets stay on this replica'
      );

      return;
    }

    if (
      this.atomic.shared &&
      !(await this.atomic.setRaw(
        HEALTH_PROBE_KEY,
        String(Date.now()),
        HEALTH_PROBE_TTL_MS
      ))
    ) {
      logger.error(
        'Dragonfly is not reachable at boot, caching on this replica until it is: check REDIS_URL, password, ACL user and CA'
      );

      return;
    }

    await this.kv.announceRelease();
  }

  async onModuleDestroy() {
    await Promise.all([this.cache.disconnect(), this.atomic.disconnect()]);
  }
}
