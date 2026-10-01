import { Injectable, Module } from '@nestjs/common';
import {
  KvTtlCacheModule,
  KvTtlCacheService,
} from '@wepublish/kv-ttl-cache/api';
import { createHash } from 'crypto';

export const SESSION_CACHE_NAMESPACE = 'auth:sessions';
export const SESSION_CACHE_TTL_SECONDS = 30;

export const sessionCacheKey = (kind: 'user' | 'peer', token: string) =>
  `${kind}:${createHash('sha256').update(token).digest('hex')}`;

@Injectable()
export class SessionCacheInvalidator {
  constructor(private kv: KvTtlCacheService) {}

  invalidate() {
    return this.kv.resetNamespace(SESSION_CACHE_NAMESPACE);
  }
}

@Module({
  imports: [KvTtlCacheModule],
  providers: [SessionCacheInvalidator],
  exports: [SessionCacheInvalidator],
})
export class SessionCacheModule {}
