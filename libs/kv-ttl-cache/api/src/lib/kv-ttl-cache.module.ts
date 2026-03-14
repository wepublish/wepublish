import { Module } from '@nestjs/common';
import { KvTtlCacheService } from './kv-ttl-cache.service';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    CacheModule.register({
      isGlobal: false,
      ttl: 600000, // 10 minutes default (callers override per entry)
      max: 50000,
    }),
  ],
  providers: [KvTtlCacheService],
  exports: [KvTtlCacheService],
})
export class KvTtlCacheModule {}
