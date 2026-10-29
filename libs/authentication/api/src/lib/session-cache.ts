import { Injectable, Module } from '@nestjs/common';
import { NamespaceResets } from '@wepublish/kv-ttl-cache/api';
import { createHash } from 'crypto';

export const SESSION_CACHE_NAMESPACE = 'auth:sessions';
export const SESSION_CACHE_TTL_SECONDS = 300;

export const sessionCacheKey = (kind: 'user' | 'peer', token: string) =>
  `${kind}:${createHash('sha256').update(token).digest('hex')}`;

@Injectable()
export class SessionCacheInvalidator {
  constructor(private resets: NamespaceResets) {}

  invalidate() {
    return this.resets.reset(SESSION_CACHE_NAMESPACE);
  }
}

@Module({
  providers: [SessionCacheInvalidator],
  exports: [SessionCacheInvalidator],
})
export class SessionCacheModule {}
