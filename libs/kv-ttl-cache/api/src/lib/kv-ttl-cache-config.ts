import type { DecimalCodec } from './kv-ttl-cache-serializer';

export const KV_TTL_CACHE_CONFIG = Symbol('KV_TTL_CACHE_CONFIG');

export type SharedNamespaceConfig = {
  localCopyMs?: number;
  acrossReleases?: boolean;
};

export type KvTtlCacheConfig = {
  decimal?: DecimalCodec;
  sharedNamespaces?: Record<string, SharedNamespaceConfig>;
};
