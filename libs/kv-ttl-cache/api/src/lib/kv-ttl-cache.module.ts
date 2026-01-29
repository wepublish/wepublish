import { Module } from '@nestjs/common';
import {KvTtlCacheService} from './kv-ttl-cache.service'
import { CacheModule } from '@nestjs/cache-manager'
import {CACHE_MANAGER} from '@nestjs/cache-manager'


@Module({
  imports: [
    CacheModule.register({
      isGlobal: false,
    }),
  ],
  providers: [KvTtlCacheService],
  exports: [KvTtlCacheService],
})
export class KvTtlCacheModule {}
